-- DutyFlow: функции, триггеры и RPC

-- Хелперы для RLS. security definer, чтобы политики на workspace_members
-- не вызывали сами себя рекурсивно.

create or replace function is_workspace_member(_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = _workspace_id and user_id = auth.uid()
  );
$$;

create or replace function is_workspace_admin(_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = _workspace_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

create or replace function can_access_task(_task_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from tasks t
    join workspace_members m on m.workspace_id = t.workspace_id
    where t.id = _task_id and m.user_id = auth.uid()
  );
$$;

create or replace function shares_workspace_with(_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from workspace_members mine
    join workspace_members theirs on theirs.workspace_id = mine.workspace_id
    where mine.user_id = auth.uid() and theirs.user_id = _user_id
  );
$$;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger workspaces_set_updated_at before update on workspaces
  for each row execute function set_updated_at();
create trigger tasks_set_updated_at before update on tasks
  for each row execute function set_updated_at();
create trigger task_comments_set_updated_at before update on task_comments
  for each row execute function set_updated_at();

-- Алфавит без символов, которые путают при диктовке: 0/O, 1/I
create or replace function generate_invite_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i int;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from workspaces where invite_code = code);
  end loop;
  return code;
end;
$$;

alter table workspaces alter column invite_code set default generate_invite_code();

create or replace function next_occurrence(
  _from timestamptz,
  _type recurrence_type,
  _config jsonb
)
returns timestamptz
language plpgsql
stable
as $$
declare
  days int[];
  candidate timestamptz;
  i int;
begin
  case _type
    when 'daily' then
      return _from + interval '1 day';
    when 'weekly' then
      return _from + interval '7 days';
    when 'biweekly' then
      return _from + interval '14 days';
    when 'monthly' then
      return _from + interval '1 month';
    when 'weekdays' then
      candidate := _from + interval '1 day';
      while extract(isodow from candidate) > 5 loop
        candidate := candidate + interval '1 day';
      end loop;
      return candidate;
    when 'custom_weekdays' then
      select array_agg(elem::int) into days
      from jsonb_array_elements_text(coalesce(_config -> 'weekdays', '[]'::jsonb)) as elem;

      if days is null then
        return null;
      end if;

      candidate := _from;
      for i in 1..7 loop
        candidate := candidate + interval '1 day';
        if extract(isodow from candidate)::int = any (days) then
          return candidate;
        end if;
      end loop;
      return null;
    else
      return null;
  end case;
end;
$$;

-- Создатель группы сразу становится owner-участником, группа получает
-- набор категорий по умолчанию.
create or replace function on_workspace_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner');

  insert into categories (workspace_id, name, icon)
  values
    (new.id, 'Дом', '🏠'),
    (new.id, 'Уборка', '🧹'),
    (new.id, 'Кухня', '🍳'),
    (new.id, 'Мусор', '🗑️'),
    (new.id, 'Покупки', '🛒'),
    (new.id, 'Ремонт', '🔧'),
    (new.id, 'Работа', '💼'),
    (new.id, 'Учёба', '📚'),
    (new.id, 'Другое', '📦');

  return new;
end;
$$;

create trigger workspaces_after_insert after insert on workspaces
  for each row execute function on_workspace_created();

create or replace function on_task_inserted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into task_history (workspace_id, task_id, actor_id, action, meta)
  values (new.workspace_id, new.id, new.created_by, 'task_created',
          jsonb_build_object('title', new.title));

  if new.assigned_to is not null and new.assigned_to <> coalesce(new.created_by, '00000000-0000-0000-0000-000000000000'::uuid) then
    insert into notifications (user_id, workspace_id, task_id, type, title, message)
    values (new.assigned_to, new.workspace_id, new.id, 'task_assigned',
            'Вам назначена новая обязанность', new.title);
  end if;

  return new;
end;
$$;

create trigger tasks_after_insert after insert on tasks
  for each row execute function on_task_inserted();

create or replace function on_task_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  points int;
  reason text;
  recipient uuid;
  next_due timestamptz;
begin
  if new.assigned_to is distinct from old.assigned_to and new.assigned_to is not null then
    insert into task_history (workspace_id, task_id, actor_id, action, meta)
    values (new.workspace_id, new.id, auth.uid(), 'task_assigned',
            jsonb_build_object('assigned_to', new.assigned_to));

    if new.assigned_to <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid) then
      insert into notifications (user_id, workspace_id, task_id, type, title, message)
      values (new.assigned_to, new.workspace_id, new.id, 'task_assigned',
              'Вам назначена новая обязанность', new.title);
    end if;
  end if;

  if new.status is distinct from old.status then
    insert into task_history (workspace_id, task_id, actor_id, action, meta)
    values (new.workspace_id, new.id, auth.uid(), 'status_changed',
            jsonb_build_object('from', old.status, 'to', new.status));
  end if;

  if new.status = 'completed' and old.status <> 'completed' then
    recipient := coalesce(new.assigned_to, new.created_by);

    if recipient is not null then
      if new.due_at is null then
        points := 10;
        reason := 'completed';
      elsif new.completed_at > new.due_at then
        points := 5;
        reason := 'completed_late';
      elsif new.completed_at <= new.due_at - interval '1 hour' then
        points := 15;
        reason := 'completed_early';
      else
        points := 10;
        reason := 'completed';
      end if;

      insert into points_transactions (workspace_id, user_id, task_id, amount, reason)
      values (new.workspace_id, recipient, new.id, points, reason)
      on conflict do nothing;
    end if;

    if new.recurrence_type <> 'none' and new.due_at is not null then
      next_due := next_occurrence(new.due_at, new.recurrence_type, new.recurrence_config);

      if next_due is not null then
        insert into tasks (
          workspace_id, title, description, created_by, assigned_to, category_id,
          priority, status, due_at, recurrence_type, recurrence_config,
          reminder_minutes, penalty_points
        )
        values (
          new.workspace_id, new.title, new.description, new.created_by, new.assigned_to,
          new.category_id, new.priority, 'todo', next_due, new.recurrence_type,
          new.recurrence_config, new.reminder_minutes, new.penalty_points
        );
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger tasks_after_update after update on tasks
  for each row execute function on_task_updated();

-- Участник без прав админа может менять у задачи только её статус
create or replace function guard_task_member_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_workspace_admin(new.workspace_id) then
    return new;
  end if;

  if new.title is distinct from old.title
    or new.description is distinct from old.description
    or new.assigned_to is distinct from old.assigned_to
    or new.category_id is distinct from old.category_id
    or new.priority is distinct from old.priority
    or new.due_at is distinct from old.due_at
    or new.recurrence_type is distinct from old.recurrence_type
    or new.recurrence_config is distinct from old.recurrence_config
    or new.reminder_minutes is distinct from old.reminder_minutes
    or new.penalty_points is distinct from old.penalty_points
    or new.workspace_id is distinct from old.workspace_id
  then
    raise exception 'Участник может менять только статус обязанности';
  end if;

  return new;
end;
$$;

create trigger tasks_before_update_guard before update on tasks
  for each row execute function guard_task_member_update();

create or replace function preview_workspace(_code text)
returns table (id uuid, name text, description text, category workspace_category, member_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select w.id, w.name, w.description, w.category, count(m.id)
  from workspaces w
  left join workspace_members m on m.workspace_id = w.id
  where w.invite_code = upper(trim(_code))
  group by w.id;
$$;

create or replace function join_workspace(_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target workspaces;
begin
  if auth.uid() is null then
    raise exception 'Требуется авторизация';
  end if;

  select * into target from workspaces where invite_code = upper(trim(_code));

  if not found then
    raise exception 'Группа с таким кодом не найдена';
  end if;

  insert into workspace_members (workspace_id, user_id, role)
  values (target.id, auth.uid(), 'member')
  on conflict (workspace_id, user_id) do nothing;

  if found then
    insert into task_history (workspace_id, actor_id, action)
    values (target.id, auth.uid(), 'member_joined');
  end if;

  return target.id;
end;
$$;

-- Просрочка не хранится в статусе, а вычисляется. Штраф начисляется лениво
-- при обращении клиента; уникальный индекс не даёт начислить дважды.
create or replace function apply_overdue_penalties(_workspace_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  applied int;
begin
  if not is_workspace_member(_workspace_id) then
    raise exception 'Нет доступа к группе';
  end if;

  insert into points_transactions (workspace_id, user_id, task_id, amount, reason)
  select t.workspace_id, t.assigned_to, t.id, -t.penalty_points, 'overdue'
  from tasks t
  where t.workspace_id = _workspace_id
    and t.status in ('todo', 'in_progress')
    and t.assigned_to is not null
    and t.due_at is not null
    and t.due_at < now()
    and t.penalty_points > 0
  on conflict do nothing;

  get diagnostics applied = row_count;
  return applied;
end;
$$;

grant execute on function preview_workspace(text) to anon, authenticated;
grant execute on function join_workspace(text) to authenticated;
grant execute on function apply_overdue_penalties(uuid) to authenticated;

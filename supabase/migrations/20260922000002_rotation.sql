-- Очередь исполнителей для повторяющихся обязанностей: список участников,
-- по которому ответственный сменяется при каждом повторе.
-- Выбор следующего делает тот же триггер, что создаёт следующую задачу,
-- поэтому очередь не зависит от того, кто и с какого устройства нажал
-- «Выполнить».

alter table tasks
  add column rotation_user_ids uuid[] not null default '{}';

create or replace function next_in_rotation(_rotation uuid[], _current uuid)
returns uuid
language plpgsql
immutable
as $$
declare
  size int := coalesce(array_length(_rotation, 1), 0);
  position int;
begin
  if size = 0 then
    return _current;
  end if;

  position := array_position(_rotation, _current);

  -- Текущего в очереди нет (например, вышел из группы) — начинаем сначала
  if position is null then
    return _rotation[1];
  end if;

  return _rotation[(position % size) + 1];
end;
$$;

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
  next_assignee uuid;
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
        next_assignee := next_in_rotation(new.rotation_user_ids, new.assigned_to);

        insert into tasks (
          workspace_id, title, description, created_by, assigned_to, category_id,
          priority, status, due_at, recurrence_type, recurrence_config,
          reminder_minutes, penalty_points, rotation_user_ids
        )
        values (
          new.workspace_id, new.title, new.description, new.created_by, next_assignee,
          new.category_id, new.priority, 'todo', next_due, new.recurrence_type,
          new.recurrence_config, new.reminder_minutes, new.penalty_points,
          new.rotation_user_ids
        );
      end if;
    end if;
  end if;

  return new;
end;
$$;

-- Очередь меняет состав задачи, значит обычному участнику её трогать нельзя
create or replace function guard_task_member_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_workspace_admin(new.workspace_id) or old.created_by = auth.uid() then
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
    or new.rotation_user_ids is distinct from old.rotation_user_ids
    or new.workspace_id is distinct from old.workspace_id
  then
    raise exception 'Менять обязанность может только её автор или администратор группы';
  end if;

  return new;
end;
$$;

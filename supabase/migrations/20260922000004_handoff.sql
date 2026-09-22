-- Передача дежурства: исполнитель может отдать свою обязанность другому
-- участнику группы. Остальные поля ему по-прежнему трогать нельзя —
-- иначе передача превратилась бы в лазейку для правки чужой задачи.

-- WITH CHECK смотрит на НОВУЮ строку, а при передаче исполнитель в ней уже
-- другой — прежний владелец задачи переставал ей соответствовать и получал
-- отказ. Поэтому проверка новой строки ослаблена до членства в группе:
-- кто именно и что именно вправе менять, решает триггер ниже.
drop policy if exists "Задачу меняет админ, автор или исполнитель" on tasks;

create policy "Задачу меняет админ, автор или исполнитель"
  on tasks for update to authenticated
  using (
    is_workspace_admin(workspace_id)
    or created_by = auth.uid()
    or assigned_to = auth.uid()
  )
  with check (is_workspace_member(workspace_id));

create or replace function guard_task_member_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_handoff boolean;
begin
  if is_workspace_admin(new.workspace_id) or old.created_by = auth.uid() then
    return new;
  end if;

  if new.title is distinct from old.title
    or new.description is distinct from old.description
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

  if new.assigned_to is distinct from old.assigned_to then
    is_handoff :=
      old.assigned_to = auth.uid()
      and new.assigned_to is not null
      and exists (
        select 1 from workspace_members
        where workspace_id = new.workspace_id and user_id = new.assigned_to
      );

    if not is_handoff then
      raise exception 'Передать обязанность может только её исполнитель, и только участнику группы';
    end if;
  end if;

  return new;
end;
$$;

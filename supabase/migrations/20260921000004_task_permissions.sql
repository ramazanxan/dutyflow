-- Создавать задачи может любой участник группы, а не только админ.
-- Автор задачи получает те же права на неё, что и админ; исполнитель
-- по-прежнему может менять только статус.

drop policy "Задачи создаёт админ" on tasks;

create policy "Задачи создаёт любой участник"
  on tasks for insert to authenticated
  with check (
    is_workspace_member(workspace_id)
    and (created_by is null or created_by = auth.uid())
  );

drop policy "Задачу меняет админ или исполнитель" on tasks;

create policy "Задачу меняет админ, автор или исполнитель"
  on tasks for update to authenticated
  using (
    is_workspace_admin(workspace_id)
    or created_by = auth.uid()
    or assigned_to = auth.uid()
  )
  with check (
    is_workspace_admin(workspace_id)
    or created_by = auth.uid()
    or assigned_to = auth.uid()
  );

drop policy "Задачи удаляет админ" on tasks;

create policy "Задачи удаляет админ или автор"
  on tasks for delete to authenticated
  using (is_workspace_admin(workspace_id) or created_by = auth.uid());

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
    or new.workspace_id is distinct from old.workspace_id
  then
    raise exception 'Менять обязанность может только её автор или администратор группы';
  end if;

  return new;
end;
$$;

-- Напоминания и просрочку нельзя вешать на фоновый процесс: бэкенда нет.
-- Уведомления создаются при заходе в группу, а уникальный индекс не даёт
-- создать одно и то же дважды. task_assigned под индекс не попадает —
-- переназначение задачи должно уведомлять повторно.

create unique index notifications_unique_task_event
  on notifications (user_id, task_id, type)
  where task_id is not null and type in ('task_reminder', 'task_overdue');

create or replace function sync_task_notifications(_workspace_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted int;
  total int := 0;
begin
  if not is_workspace_member(_workspace_id) then
    raise exception 'Нет доступа к группе';
  end if;

  insert into notifications (user_id, workspace_id, task_id, type, title, message)
  select t.assigned_to, t.workspace_id, t.id, 'task_reminder', 'Скоро дедлайн', t.title
  from tasks t
  where t.workspace_id = _workspace_id
    and t.status in ('todo', 'in_progress')
    and t.assigned_to is not null
    and t.due_at is not null
    and t.reminder_minutes is not null
    and now() >= t.due_at - make_interval(mins => t.reminder_minutes)
    and now() < t.due_at
  on conflict do nothing;

  get diagnostics inserted = row_count;
  total := total + inserted;

  insert into notifications (user_id, workspace_id, task_id, type, title, message)
  select t.assigned_to, t.workspace_id, t.id, 'task_overdue', 'Обязанность просрочена', t.title
  from tasks t
  where t.workspace_id = _workspace_id
    and t.status in ('todo', 'in_progress')
    and t.assigned_to is not null
    and t.due_at is not null
    and t.due_at < now()
  on conflict do nothing;

  get diagnostics inserted = row_count;
  total := total + inserted;

  return total;
end;
$$;

grant execute on function sync_task_notifications(uuid) to authenticated;

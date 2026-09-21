-- DutyFlow: RLS и Realtime
-- Записи в task_history, notifications и points_transactions делают только
-- security definer триггеры, поэтому insert-политик для клиента у них нет.

alter table profiles enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table categories enable row level security;
alter table tasks enable row level security;
alter table task_comments enable row level security;
alter table task_history enable row level security;
alter table notifications enable row level security;
alter table points_transactions enable row level security;

create policy "Профиль виден себе и участникам общих групп"
  on profiles for select to authenticated
  using (id = auth.uid() or shares_workspace_with(id));

create policy "Свой профиль можно создать"
  on profiles for insert to authenticated
  with check (id = auth.uid());

create policy "Свой профиль можно изменить"
  on profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Группа видна своим участникам"
  on workspaces for select to authenticated
  using (is_workspace_member(id));

create policy "Группу создаёт её владелец"
  on workspaces for insert to authenticated
  with check (owner_id = auth.uid());

create policy "Группу меняет админ"
  on workspaces for update to authenticated
  using (is_workspace_admin(id))
  with check (is_workspace_admin(id));

create policy "Группу удаляет владелец"
  on workspaces for delete to authenticated
  using (owner_id = auth.uid());

create policy "Участники видны участникам"
  on workspace_members for select to authenticated
  using (is_workspace_member(workspace_id));

create policy "Участников добавляет админ"
  on workspace_members for insert to authenticated
  with check (is_workspace_admin(workspace_id));

create policy "Роли меняет админ"
  on workspace_members for update to authenticated
  using (is_workspace_admin(workspace_id))
  with check (is_workspace_admin(workspace_id));

create policy "Удалить участника может админ, выйти может каждый"
  on workspace_members for delete to authenticated
  using (is_workspace_admin(workspace_id) or user_id = auth.uid());

create policy "Категории видны участникам"
  on categories for select to authenticated
  using (is_workspace_member(workspace_id));

create policy "Категории создаёт админ"
  on categories for insert to authenticated
  with check (is_workspace_admin(workspace_id));

create policy "Категории меняет админ"
  on categories for update to authenticated
  using (is_workspace_admin(workspace_id))
  with check (is_workspace_admin(workspace_id));

create policy "Категории удаляет админ"
  on categories for delete to authenticated
  using (is_workspace_admin(workspace_id));

create policy "Задачи видны участникам"
  on tasks for select to authenticated
  using (is_workspace_member(workspace_id));

create policy "Задачи создаёт админ"
  on tasks for insert to authenticated
  with check (is_workspace_admin(workspace_id));

create policy "Задачу меняет админ или исполнитель"
  on tasks for update to authenticated
  using (is_workspace_admin(workspace_id) or assigned_to = auth.uid())
  with check (is_workspace_admin(workspace_id) or assigned_to = auth.uid());

create policy "Задачи удаляет админ"
  on tasks for delete to authenticated
  using (is_workspace_admin(workspace_id));

create policy "Комментарии видны участникам"
  on task_comments for select to authenticated
  using (can_access_task(task_id));

create policy "Комментарий пишет участник от своего имени"
  on task_comments for insert to authenticated
  with check (can_access_task(task_id) and user_id = auth.uid());

create policy "Свой комментарий можно изменить"
  on task_comments for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Свой комментарий можно удалить"
  on task_comments for delete to authenticated
  using (user_id = auth.uid());

create policy "История видна участникам"
  on task_history for select to authenticated
  using (is_workspace_member(workspace_id));

create policy "Свои уведомления видны"
  on notifications for select to authenticated
  using (user_id = auth.uid());

create policy "Свои уведомления можно отметить прочитанными"
  on notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Свои уведомления можно удалить"
  on notifications for delete to authenticated
  using (user_id = auth.uid());

create policy "Начисления видны участникам группы"
  on points_transactions for select to authenticated
  using (is_workspace_member(workspace_id));

alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table task_comments;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table workspace_members;
alter publication supabase_realtime add table points_transactions;

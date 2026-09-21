-- При создании группы PostgREST возвращает созданную строку, то есть после
-- INSERT выполняется SELECT под политикой чтения. is_workspace_member объявлена
-- STABLE и видит снимок данных на начало запроса, поэтому строку из
-- workspaces_after_insert она ещё не видит и чтение падает с 42501.
-- Владелец должен видеть свою группу и без обращения к workspace_members.

drop policy "Группа видна своим участникам" on workspaces;

create policy "Группа видна участникам и владельцу"
  on workspaces for select to authenticated
  using (owner_id = auth.uid() or is_workspace_member(id));

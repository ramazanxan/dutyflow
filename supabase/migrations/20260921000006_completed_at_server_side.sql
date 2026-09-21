-- Время выполнения проставляет сервер: от него зависит начисление XP
-- (раньше / вовремя / просрочено), а часы на устройстве участника могут врать.

create or replace function set_completed_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    new.completed_at := now();
  elsif new.status <> 'completed' then
    new.completed_at := null;
  end if;

  return new;
end;
$$;

create trigger tasks_before_update_completed_at before update on tasks
  for each row execute function set_completed_at();

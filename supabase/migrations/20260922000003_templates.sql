-- Шаблоны обязанностей: набор задач, который создаётся одной кнопкой.
-- Права те же, что у задач: заводить может любой участник, чужой шаблон
-- меняет только автор или администратор.

create table task_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  icon text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table template_tasks (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references task_templates (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  category_id uuid references categories (id) on delete set null,
  priority task_priority not null default 'normal',
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index task_templates_workspace_idx on task_templates (workspace_id, created_at);
create index template_tasks_template_idx on template_tasks (template_id, position);

alter table task_templates enable row level security;
alter table template_tasks enable row level security;

create policy "Шаблоны видны участникам"
  on task_templates for select to authenticated
  using (is_workspace_member(workspace_id));

create policy "Шаблон создаёт участник от своего имени"
  on task_templates for insert to authenticated
  with check (
    is_workspace_member(workspace_id)
    and (created_by is null or created_by = auth.uid())
  );

create policy "Шаблон меняет автор или админ"
  on task_templates for update to authenticated
  using (is_workspace_admin(workspace_id) or created_by = auth.uid())
  with check (is_workspace_admin(workspace_id) or created_by = auth.uid());

create policy "Шаблон удаляет автор или админ"
  on task_templates for delete to authenticated
  using (is_workspace_admin(workspace_id) or created_by = auth.uid());

-- Пункты шаблона наследуют доступ самого шаблона
create or replace function can_edit_template(_template_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from task_templates t
    where t.id = _template_id
      and (is_workspace_admin(t.workspace_id) or t.created_by = auth.uid())
  );
$$;

create or replace function can_read_template(_template_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from task_templates t
    where t.id = _template_id and is_workspace_member(t.workspace_id)
  );
$$;

create policy "Пункты шаблона видны участникам"
  on template_tasks for select to authenticated
  using (can_read_template(template_id));

create policy "Пункты шаблона добавляет автор или админ"
  on template_tasks for insert to authenticated
  with check (can_edit_template(template_id));

create policy "Пункты шаблона меняет автор или админ"
  on template_tasks for update to authenticated
  using (can_edit_template(template_id))
  with check (can_edit_template(template_id));

create policy "Пункты шаблона удаляет автор или админ"
  on template_tasks for delete to authenticated
  using (can_edit_template(template_id));

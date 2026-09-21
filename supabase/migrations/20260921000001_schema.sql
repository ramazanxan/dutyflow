-- DutyFlow: базовая схема

create type member_role as enum ('owner', 'admin', 'member');
create type workspace_category as enum ('home', 'work', 'study', 'other');
create type task_status as enum ('todo', 'in_progress', 'completed', 'cancelled');
create type task_priority as enum ('low', 'normal', 'high', 'urgent');
create type recurrence_type as enum (
  'none', 'daily', 'weekdays', 'weekly', 'biweekly', 'monthly', 'custom_weekdays'
);
create type notification_type as enum (
  'task_assigned', 'task_completed', 'task_overdue', 'task_reminder',
  'task_comment', 'member_joined'
);

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 40),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 60),
  description text,
  category workspace_category not null default 'home',
  owner_id uuid not null references auth.users (id) on delete cascade,
  invite_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role member_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  name text not null,
  icon text,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text,
  created_by uuid references auth.users (id) on delete set null,
  assigned_to uuid references auth.users (id) on delete set null,
  category_id uuid references categories (id) on delete set null,
  priority task_priority not null default 'normal',
  status task_status not null default 'todo',
  due_at timestamptz,
  recurrence_type recurrence_type not null default 'none',
  recurrence_config jsonb not null default '{}'::jsonb,
  reminder_minutes int check (reminder_minutes is null or reminder_minutes >= 0),
  penalty_points int not null default 10 check (penalty_points >= 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table task_history (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  task_id uuid references tasks (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid references workspaces (id) on delete cascade,
  task_id uuid references tasks (id) on delete cascade,
  type notification_type not null,
  title text not null,
  message text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table points_transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  task_id uuid references tasks (id) on delete cascade,
  amount int not null,
  reason text not null,
  created_at timestamptz not null default now()
);

-- Защита от повторного начисления одного и того же события по задаче
create unique index points_transactions_unique_event
  on points_transactions (task_id, user_id, reason)
  where task_id is not null;

create index workspace_members_user_idx on workspace_members (user_id);
create index workspace_members_workspace_idx on workspace_members (workspace_id);
create index categories_workspace_idx on categories (workspace_id);
create index tasks_workspace_status_idx on tasks (workspace_id, status);
create index tasks_assigned_idx on tasks (assigned_to);
create index tasks_due_at_idx on tasks (due_at);
create index task_comments_task_idx on task_comments (task_id, created_at);
create index task_history_workspace_idx on task_history (workspace_id, created_at desc);
create index task_history_task_idx on task_history (task_id, created_at desc);
create index notifications_user_idx on notifications (user_id, is_read, created_at desc);
create index points_transactions_workspace_user_idx on points_transactions (workspace_id, user_id);

-- NextGen Visualizer CRM extensions (run after schema.sql)

-- Add CRM fields to existing table
alter table public.nextgen_visualizer_projects
  add column if not exists status text not null default 'New',
  add column if not exists source text not null default 'Visualizer',
  add column if not exists assigned_to text,
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists tags text[];

create index if not exists idx_nextgen_visualizer_projects_status
  on public.nextgen_visualizer_projects (status);

create index if not exists idx_nextgen_visualizer_projects_followup
  on public.nextgen_visualizer_projects (next_follow_up_at);

-- Notes
create table if not exists public.nextgen_visualizer_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id text not null references public.nextgen_visualizer_projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  author text,
  body text not null
);
create index if not exists idx_nextgen_visualizer_notes_lead
  on public.nextgen_visualizer_notes (lead_id, created_at desc);

-- Tasks
create table if not exists public.nextgen_visualizer_tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id text not null references public.nextgen_visualizer_projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  due_at timestamptz,
  completed boolean not null default false,
  title text not null,
  notes text
);
create index if not exists idx_nextgen_visualizer_tasks_lead
  on public.nextgen_visualizer_tasks (lead_id, completed, due_at);

-- Optional: simple users table (for assignments). Can be expanded later.
create table if not exists public.nextgen_visualizer_users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text unique
);


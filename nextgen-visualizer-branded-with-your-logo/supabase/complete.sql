-- Optional CRM enhancements (run after schema.sql + crm.sql)

-- Track updates and last contact date
alter table public.nextgen_visualizer_projects
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists last_contacted_at timestamptz;

create index if not exists idx_nextgen_visualizer_projects_updated_at
  on public.nextgen_visualizer_projects (updated_at desc);

create index if not exists idx_nextgen_visualizer_projects_last_contacted
  on public.nextgen_visualizer_projects (last_contacted_at desc);

-- Simple trigger to auto-update updated_at on changes
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_nextgen_visualizer_projects_updated_at on public.nextgen_visualizer_projects;
create trigger trg_nextgen_visualizer_projects_updated_at
before update on public.nextgen_visualizer_projects
for each row execute function public.set_updated_at();

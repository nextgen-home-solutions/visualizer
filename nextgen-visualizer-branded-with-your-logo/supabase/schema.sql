-- NextGen Visualizer (Supabase schema)
-- Run this in Supabase SQL Editor

create table if not exists public.nextgen_visualizer_projects (
  id text primary key,
  created_at timestamptz not null default now(),
  lead_name text not null,
  lead_email text not null,
  lead_phone text,
  lead_address text,
  lead_timeline text,
  project_type text not null,
  style text not null,
  quality text not null,
  room_size_sqft integer not null,
  description text,
  selected_products jsonb not null default '[]'::jsonb,
  images jsonb not null default '[]'::jsonb,
  variants jsonb not null default '[]'::jsonb,
  estimate jsonb
);

create index if not exists idx_nextgen_visualizer_projects_created_at
  on public.nextgen_visualizer_projects (created_at desc);

create index if not exists idx_nextgen_visualizer_projects_email
  on public.nextgen_visualizer_projects (lead_email);

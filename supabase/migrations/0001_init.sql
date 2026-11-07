-- CreModelAI initial schema. Multi-tenant: every org-owned row carries org_id and is protected by RLS.
-- Assumptions (products, costs, staff, investments, funding) are stored as versioned JSON in
-- financial_model_versions.inputs so each version is an immutable record of the assumptions used.
-- Calculated outputs live separately in financial_model_outputs.

create extension if not exists "pgcrypto";

-- ---------- enums ----------
create type member_role as enum ('owner','administrator','founder','cfo','analyst','consultant','finance_manager','viewer');

-- ---------- core ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  description text,
  stage text,
  is_existing_business boolean not null default false,
  currency text not null default 'USD',
  planning_horizon_months int not null default 24,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table organization_members (
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index on organization_members (user_id);

create table organization_settings (
  org_id uuid primary key references organizations(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- membership helpers (security definer avoids RLS recursion) ----------
create or replace function is_org_member(o uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from organization_members where org_id = o and user_id = auth.uid());
$$;

create or replace function can_edit_org(o uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from organization_members
    where org_id = o and user_id = auth.uid()
      and role in ('owner','administrator','founder','cfo','analyst','consultant','finance_manager'));
$$;

create or replace function is_org_admin(o uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from organization_members
    where org_id = o and user_id = auth.uid() and role in ('owner','administrator'));
$$;

-- Atomically create an organization and make the caller its owner.
create or replace function create_organization(
  p_name text, p_industry text, p_description text, p_stage text,
  p_existing boolean, p_currency text, p_horizon int
) returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into organizations (name, industry, description, stage, is_existing_business, currency, planning_horizon_months, created_by)
  values (p_name, p_industry, p_description, p_stage, p_existing, p_currency, p_horizon, auth.uid())
  returning id into new_id;
  insert into organization_members (org_id, user_id, role) values (new_id, auth.uid(), 'owner');
  insert into organization_settings (org_id) values (new_id);
  insert into audit_logs (org_id, user_id, action, entity, entity_id) values (new_id, auth.uid(), 'organization.created', 'organization', new_id::text);
  return new_id;
end $$;

create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name') on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- ---------- business models ----------
create table business_models (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  status text not null default 'active' check (status in ('active','archived')),
  current_version_id uuid,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on business_models (org_id);

create table business_profiles (
  model_id uuid primary key references business_models(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  industry text, description text, business_model text, target_customers text,
  products_services text, location text,
  updated_at timestamptz not null default now()
);

create table financial_model_versions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  model_id uuid not null references business_models(id) on delete cascade,
  version_number int not null,
  inputs jsonb not null,          -- assumptions (user-provided)
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (model_id, version_number)
);
create index on financial_model_versions (org_id, model_id);

-- Calculated outputs are stored separately from assumptions.
create table financial_model_outputs (
  version_id uuid primary key references financial_model_versions(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  outputs jsonb not null,
  engine_version text not null default '1',
  calculated_at timestamptz not null default now()
);

alter table business_models add constraint fk_current_version
  foreign key (current_version_id) references financial_model_versions(id) on delete set null;

create table financial_scenarios (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  model_id uuid not null references business_models(id) on delete cascade,
  name text not null,
  adjustments jsonb not null,
  notes text,
  results jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index on financial_scenarios (org_id, model_id);

create table model_change_history (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  model_id uuid not null references business_models(id) on delete cascade,
  user_id uuid references auth.users(id),
  summary text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);
create index on model_change_history (org_id, model_id, created_at desc);

-- ---------- analysis & planning ----------
create table viability_assessments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  model_id uuid not null references business_models(id) on delete cascade,
  version_id uuid references financial_model_versions(id) on delete set null,
  content jsonb not null,
  created_at timestamptz not null default now()
);

create table business_plans (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  model_id uuid not null references business_models(id) on delete cascade,
  version_id uuid references financial_model_versions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table business_plan_sections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  plan_id uuid not null references business_plans(id) on delete cascade,
  position int not null,
  title text not null,
  body text not null default '',
  source text not null default 'user' check (source in ('user','ai','model')),
  updated_at timestamptz not null default now()
);

create table ai_insights (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  model_id uuid references business_models(id) on delete cascade,
  agent text not null,
  kind text not null,
  title text not null,
  body jsonb not null,
  created_at timestamptz not null default now()
);

create table ai_agent_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references auth.users(id),
  model_id uuid references business_models(id) on delete set null,
  agent text not null,
  status text not null check (status in ('success','error')),
  error text,
  duration_ms int,
  created_at timestamptz not null default now()
);

create table recommended_actions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  model_id uuid references business_models(id) on delete cascade,
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  status text not null default 'open' check (status in ('open','in_progress','done','dismissed')),
  assignee uuid references auth.users(id),
  notes text,
  source text not null default 'user',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  model_id uuid references business_models(id) on delete set null,
  kind text not null,
  title text not null,
  content jsonb not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ---------- imports ----------
create table data_imports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  model_id uuid references business_models(id) on delete set null,
  file_name text not null,
  storage_path text,
  category text,
  mapping jsonb,
  summary jsonb,   -- imported / rejected / needs-review counts
  status text not null default 'previewed' check (status in ('previewed','imported','failed')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ---------- billing / usage / audit ----------
create table subscriptions (
  org_id uuid primary key references organizations(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','professional','enterprise')),
  status text not null default 'inactive' check (status in ('inactive','active','past_due','canceled')),
  activated_by text,           -- 'payment_webhook' or 'admin' only; never set from a client redirect
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create table usage_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references auth.users(id),
  kind text not null,  -- ai_analysis, agent_run, model_generation, scenario_simulation, document_extraction, plan_generation, report_generation
  quantity int not null default 1,
  created_at timestamptz not null default now()
);
create index on usage_records (org_id, kind, created_at desc);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  user_id uuid,
  action text not null,
  entity text,
  entity_id text,
  detail jsonb,
  created_at timestamptz not null default now()
);
create index on audit_logs (org_id, created_at desc);

-- ---------- storage bucket for uploads (private, org-prefixed paths) ----------
insert into storage.buckets (id, name, public) values ('imports', 'imports', false) on conflict do nothing;

create policy "org members read imports" on storage.objects for select
  using (bucket_id = 'imports' and is_org_member(((storage.foldername(name))[1])::uuid));
create policy "org editors upload imports" on storage.objects for insert
  with check (bucket_id = 'imports' and can_edit_org(((storage.foldername(name))[1])::uuid));

-- ---------- Row Level Security ----------
alter table profiles enable row level security;
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table organization_settings enable row level security;
alter table business_models enable row level security;
alter table business_profiles enable row level security;
alter table financial_model_versions enable row level security;
alter table financial_model_outputs enable row level security;
alter table financial_scenarios enable row level security;
alter table model_change_history enable row level security;
alter table viability_assessments enable row level security;
alter table business_plans enable row level security;
alter table business_plan_sections enable row level security;
alter table ai_insights enable row level security;
alter table ai_agent_runs enable row level security;
alter table recommended_actions enable row level security;
alter table reports enable row level security;
alter table data_imports enable row level security;
alter table subscriptions enable row level security;
alter table usage_records enable row level security;
alter table audit_logs enable row level security;

-- profiles: own row only
create policy profiles_self_read on profiles for select using (id = auth.uid());
create policy profiles_self_write on profiles for update using (id = auth.uid());

-- organizations: members read; admins update; creation happens only through create_organization()
create policy org_read on organizations for select using (is_org_member(id));
create policy org_update on organizations for update using (is_org_admin(id));

-- members: members see teammates; admins manage
create policy members_read on organization_members for select using (is_org_member(org_id));
create policy members_admin_write on organization_members for all using (is_org_admin(org_id)) with check (is_org_admin(org_id));

create policy settings_read on organization_settings for select using (is_org_member(org_id));
create policy settings_write on organization_settings for all using (is_org_admin(org_id)) with check (is_org_admin(org_id));

-- generic org-owned tables: members read, editors write
do $$
declare t text;
begin
  foreach t in array array[
    'business_models','business_profiles','financial_model_versions','financial_model_outputs','financial_scenarios',
    'model_change_history','viability_assessments','business_plans','business_plan_sections','ai_insights',
    'recommended_actions','reports','data_imports'
  ] loop
    execute format('create policy %I on %I for select using (is_org_member(org_id))', t || '_read', t);
    execute format('create policy %I on %I for insert with check (can_edit_org(org_id))', t || '_insert', t);
    execute format('create policy %I on %I for update using (can_edit_org(org_id)) with check (can_edit_org(org_id))', t || '_update', t);
    execute format('create policy %I on %I for delete using (can_edit_org(org_id))', t || '_delete', t);
  end loop;
end $$;

-- history/versions are append-only for clients
drop policy financial_model_versions_update on financial_model_versions;
drop policy financial_model_versions_delete on financial_model_versions;
drop policy model_change_history_update on model_change_history;
drop policy model_change_history_delete on model_change_history;

-- agent runs, usage and audit: members read; writes only via service role (server-side)
create policy ai_agent_runs_read on ai_agent_runs for select using (is_org_member(org_id));
create policy usage_read on usage_records for select using (is_org_member(org_id));
create policy audit_read on audit_logs for select using (org_id is not null and is_org_admin(org_id));
-- subscriptions: members read; only service role (payment confirmation / verified admin workflow) writes
create policy subs_read on subscriptions for select using (is_org_member(org_id));

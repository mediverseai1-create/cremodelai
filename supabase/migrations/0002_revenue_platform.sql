-- Revenue-intelligence tables. Reuses organizations, organization_members, recommended_actions,
-- ai_agent_runs, ai_insights, usage_records, audit_logs, subscriptions and data_imports from 0001.
-- The old financial-modeling tables from 0001 are left in place but are no longer used by the app.

create table sales_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  sold_at date not null,
  customer text not null,
  product text,
  region text,
  rep text,
  amount numeric(16,2) not null,
  quantity numeric(14,2),
  import_id uuid references data_imports(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on sales_records (org_id, sold_at);
create index on sales_records (org_id, customer);

create table pipeline_deals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  account text,
  owner text,
  stage text not null default 'find' check (stage in ('find','prepare','converse','follow_up','close','won','lost')),
  value numeric(16,2),
  expected_close date,
  follow_up_on date,
  last_contact date,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on pipeline_deals (org_id, stage);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  deal_id uuid references pipeline_deals(id) on delete set null,
  title text not null,
  transcript text not null,
  analysis jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table briefings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  cadence text not null check (cadence in ('daily','weekly','biweekly','monthly','quarterly','biannual','annual')),
  period_start date not null,
  period_end date not null,
  metrics jsonb not null,   -- deterministic numbers the narrative was written from
  content jsonb,            -- AI narrative (null if AI was unavailable)
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index on briefings (org_id, created_at desc);

create table lead_candidates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  industry text,
  region text,
  notes text,
  score int check (score between 0 and 100),
  reasoning text,
  scored_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['sales_records','pipeline_deals','conversations','briefings','lead_candidates'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select using (is_org_member(org_id))', t || '_read', t);
    execute format('create policy %I on %I for insert with check (can_edit_org(org_id))', t || '_insert', t);
    execute format('create policy %I on %I for update using (can_edit_org(org_id)) with check (can_edit_org(org_id))', t || '_update', t);
    execute format('create policy %I on %I for delete using (can_edit_org(org_id))', t || '_delete', t);
  end loop;
end $$;

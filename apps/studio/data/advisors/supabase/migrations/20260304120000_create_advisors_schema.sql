-- =============================================================================
-- Supabase Advisors Schema
-- Persistent alerting, rules, issues, AI agents, and notification channels.
--
-- Designed to work both on hosted Supabase (with pg_cron, pg_net, vault)
-- and on local dev / self-hosted (where those extensions may not exist).
-- =============================================================================

-- Extensions (safe: IF NOT EXISTS)
create extension if not exists "uuid-ossp";

-- pg_net is optional — edge function invocation won't work without it
do $$ begin
  create extension if not exists pg_net with schema extensions;
exception when others then
  raise notice 'pg_net not available — edge function rule execution will be disabled';
end $$;

-- pg_cron is optional — scheduled rule evaluation won't work without it
do $$ begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    grant usage on schema cron to postgres;
    grant all privileges on all tables in schema cron to postgres;
  else
    raise notice 'pg_cron not available — scheduled rule evaluation will be disabled';
  end if;
end $$;

-- =============================================================================
-- Schema
-- =============================================================================

create schema if not exists _supabase_advisors;
grant usage on schema _supabase_advisors to postgres, service_role;
grant all privileges on all tables in schema _supabase_advisors to postgres, service_role;
alter default privileges in schema _supabase_advisors
  grant all on tables to postgres, service_role;

-- =============================================================================
-- Rules
-- =============================================================================

create table _supabase_advisors.rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text not null,
  description text not null default '',
  category text not null default 'general',
  source text not null default 'sql',
  sql_query text,
  edge_function_name text,
  api_endpoint text,
  severity text not null default 'warning'
    check (severity in ('critical', 'warning', 'info')),
  level text not null default 'WARN'
    check (level in ('ERROR', 'WARN', 'INFO')),
  schedule text not null default '0 */6 * * *',
  cooldown_seconds int not null default 3600,
  is_system boolean not null default false,
  is_enabled boolean not null default true,
  default_message text,
  remediation text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rules_source_check check (
    sql_query is not null
    or edge_function_name is not null
    or api_endpoint is not null
  )
);

create index idx_rules_category on _supabase_advisors.rules(category);
create index idx_rules_is_system on _supabase_advisors.rules(is_system);
create index idx_rules_is_enabled on _supabase_advisors.rules(is_enabled);

-- =============================================================================
-- Issues (user-facing, lifecycle-managed)
-- =============================================================================

create table _supabase_advisors.issues (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  severity text not null default 'warning'
    check (severity in ('critical', 'warning', 'info')),
  category text not null default 'general',
  status text not null default 'open'
    check (status in ('open', 'acknowledged', 'snoozed', 'resolved', 'dismissed')),
  snoozed_until timestamptz,
  resolved_at timestamptz,
  resolved_by text,
  dedup_key text not null,
  alert_count int not null default 1,
  first_triggered_at timestamptz not null default now(),
  last_triggered_at timestamptz not null default now(),
  suggested_actions jsonb not null default '[]'::jsonb,
  actions_taken jsonb not null default '[]'::jsonb,
  assigned_to text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_issues_status on _supabase_advisors.issues(status)
  where status in ('open', 'acknowledged', 'snoozed');
create index idx_issues_dedup on _supabase_advisors.issues(dedup_key)
  where status in ('open', 'acknowledged', 'snoozed');
create index idx_issues_category on _supabase_advisors.issues(category);
create index idx_issues_severity on _supabase_advisors.issues(severity);

-- =============================================================================
-- Alerts (immutable records of rule firings)
-- =============================================================================

create table _supabase_advisors.alerts (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid references _supabase_advisors.rules(id) on delete set null,
  issue_id uuid references _supabase_advisors.issues(id) on delete cascade,
  severity text not null default 'warning'
    check (severity in ('critical', 'warning', 'info')),
  category text not null default 'general',
  title text not null,
  description text,
  signal_snapshot jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  triggered_at timestamptz not null default now()
);

create index idx_alerts_rule on _supabase_advisors.alerts(rule_id);
create index idx_alerts_issue on _supabase_advisors.alerts(issue_id);
create index idx_alerts_triggered on _supabase_advisors.alerts(triggered_at desc);

-- =============================================================================
-- Agents
-- =============================================================================

create table _supabase_advisors.agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  summary text,
  system_prompt text,
  tools text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================================
-- Agent Tasks
-- =============================================================================

create table _supabase_advisors.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references _supabase_advisors.agents(id) on delete cascade,
  name text not null,
  description text not null,
  schedule text not null,
  is_unique boolean not null default false,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_agent_tasks_agent on _supabase_advisors.agent_tasks(agent_id);

-- =============================================================================
-- Conversations
-- =============================================================================

create table _supabase_advisors.conversations (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references _supabase_advisors.issues(id) on delete set null,
  task_id uuid references _supabase_advisors.agent_tasks(id) on delete set null,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_conversations_issue on _supabase_advisors.conversations(issue_id);
create index idx_conversations_task on _supabase_advisors.conversations(task_id);

-- =============================================================================
-- Conversation Messages
-- =============================================================================

create table _supabase_advisors.conversation_messages (
  id text primary key,
  conversation_id uuid not null references _supabase_advisors.conversations(id) on delete cascade,
  agent_id uuid references _supabase_advisors.agents(id) on delete set null,
  task_id uuid references _supabase_advisors.agent_tasks(id) on delete set null,
  role text not null check (role in ('user', 'assistant', 'system', 'data', 'tool')),
  parts jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_conv_messages_conversation on _supabase_advisors.conversation_messages(conversation_id);

-- =============================================================================
-- Notification Channels
-- =============================================================================

create table _supabase_advisors.channels (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('email', 'slack', 'webhook', 'push')),
  name text not null,
  config jsonb not null default '{}'::jsonb,
  severity_filter text[] not null default array['critical', 'warning'],
  category_filter text[],
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================================
-- Notification Log
-- =============================================================================

create table _supabase_advisors.notifications (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references _supabase_advisors.issues(id) on delete cascade,
  channel_id uuid references _supabase_advisors.channels(id) on delete set null,
  channel_type text not null,
  recipient text not null,
  payload jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_issue on _supabase_advisors.notifications(issue_id);
create index idx_notifications_status on _supabase_advisors.notifications(status)
  where status = 'pending';

-- =============================================================================
-- Triggers: updated_at
-- =============================================================================

create or replace function _supabase_advisors.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_rules_updated_at
  before update on _supabase_advisors.rules
  for each row execute function _supabase_advisors.handle_updated_at();

create trigger set_issues_updated_at
  before update on _supabase_advisors.issues
  for each row execute function _supabase_advisors.handle_updated_at();

create trigger set_agents_updated_at
  before update on _supabase_advisors.agents
  for each row execute function _supabase_advisors.handle_updated_at();

create trigger set_agent_tasks_updated_at
  before update on _supabase_advisors.agent_tasks
  for each row execute function _supabase_advisors.handle_updated_at();

create trigger set_conversations_updated_at
  before update on _supabase_advisors.conversations
  for each row execute function _supabase_advisors.handle_updated_at();

create trigger set_channels_updated_at
  before update on _supabase_advisors.channels
  for each row execute function _supabase_advisors.handle_updated_at();

-- =============================================================================
-- Cron Interval Helper (pure SQL, no extension dependency)
-- =============================================================================

create or replace function _supabase_advisors.cron_interval_seconds(p_schedule text)
returns integer
language plpgsql
immutable
as $$
declare
  v_parts text[];
  v_minute text;
  v_hour text;
  v_dom text;
  v_month text;
  v_step integer;
begin
  v_parts := string_to_array(trim(p_schedule), ' ');
  if array_length(v_parts, 1) < 5 then return 86400; end if;

  v_minute := v_parts[1];
  v_hour   := v_parts[2];
  v_dom    := v_parts[3];
  v_month  := v_parts[4];

  if v_minute ~ '^\*/\d+$' then
    v_step := substring(v_minute from '^\*/(\d+)$')::integer;
    return v_step * 60;
  end if;
  if v_hour ~ '^\*/\d+$' then
    v_step := substring(v_hour from '^\*/(\d+)$')::integer;
    return v_step * 3600;
  end if;
  if v_minute <> '*' and v_hour = '*' then return 3600; end if;
  if v_minute <> '*' and v_hour <> '*' and v_dom = '*' then return 86400; end if;
  if v_minute <> '*' and v_hour <> '*' and v_dom <> '*' and v_month = '*' then
    return 86400 * 30;
  end if;

  return 86400;
end;
$$;

-- =============================================================================
-- Rule Execution
-- SQL rules always work. Edge function rules need pg_net + vault.
-- =============================================================================

create or replace function _supabase_advisors.execute_rule(p_rule_id uuid, p_force boolean default false)
returns text
language plpgsql
security definer
as $$
declare
  v_rule record;
  v_row record;
  v_rows jsonb := '[]'::jsonb;
  v_row_count integer := 0;
  v_supabase_url text;
  v_service_role_key text;
  v_dedup_key text;
  v_issue_id uuid;
  v_alert_title text;
  v_alert_desc text;
  v_last_alert_at timestamptz;
  v_has_pg_net boolean;
  v_sql text;
  v_set_stmt text;
begin
  select * into v_rule
    from _supabase_advisors.rules
    where id = p_rule_id and is_enabled = true;

  if not found then return 'rule_not_found'; end if;

  if v_rule.sql_query is not null then
    v_sql := trim(v_rule.sql_query);

    -- Extract and execute any SET LOCAL statements before the main query.
    -- Splinter rules use "set local search_path = '';" as a prefix.
    while v_sql ~* '^\s*set\s+' loop
      v_set_stmt := substring(v_sql from '^\s*[^;]*;');
      execute v_set_stmt;
      v_sql := trim(substring(v_sql from length(v_set_stmt) + 1));
    end loop;

    for v_row in execute v_sql
    loop
      v_rows := v_rows || to_jsonb(v_row);
      v_row_count := v_row_count + 1;
    end loop;

    if v_row_count = 0 then
      return 'no_findings';
    end if;

    v_dedup_key := 'rule_' || p_rule_id::text;

    if not p_force then
      select max(a.triggered_at) into v_last_alert_at
        from _supabase_advisors.alerts a
        where a.rule_id = p_rule_id;

      if v_last_alert_at is not null
         and v_last_alert_at > now() - make_interval(secs => v_rule.cooldown_seconds) then
        return 'cooldown:' || v_row_count;
      end if;
    end if;

    v_alert_title := v_rule.title;
    v_alert_desc := v_rule.description || E'\n\nQuery results:\n' || jsonb_pretty(v_rows);

    select id into v_issue_id
      from _supabase_advisors.issues
      where dedup_key = v_dedup_key
        and status in ('open', 'acknowledged', 'snoozed')
      limit 1;

    if v_issue_id is null then
      insert into _supabase_advisors.issues (
        title, description, severity, category, dedup_key,
        suggested_actions, metadata
      ) values (
        v_alert_title, v_rule.description, v_rule.severity, v_rule.category,
        v_dedup_key,
        coalesce(
          case when v_rule.remediation is not null
            then jsonb_build_array(jsonb_build_object('type', 'link', 'label', 'View remediation', 'url', v_rule.remediation))
            else '[]'::jsonb
          end,
          '[]'::jsonb
        ),
        v_rule.metadata
      )
      returning id into v_issue_id;
    else
      update _supabase_advisors.issues
      set alert_count = alert_count + 1,
          last_triggered_at = now(),
          severity = case
            when v_rule.severity = 'critical' then 'critical'
            when severity = 'critical' then 'critical'
            when v_rule.severity = 'warning' then 'warning'
            else severity
          end
      where id = v_issue_id;
    end if;

    insert into _supabase_advisors.alerts (
      rule_id, issue_id, severity, category, title, description,
      signal_snapshot, metadata
    ) values (
      p_rule_id, v_issue_id, v_rule.severity, v_rule.category,
      v_alert_title, v_alert_desc,
      jsonb_build_object('query_results', v_rows),
      v_rule.metadata
    );

    return 'alert_created:' || v_row_count;

  elsif v_rule.edge_function_name is not null then
    select exists(select 1 from pg_extension where extname = 'pg_net') into v_has_pg_net;
    if not v_has_pg_net then
      return 'pg_net_unavailable';
    end if;

    begin
      select decrypted_secret into v_supabase_url
        from vault.decrypted_secrets where name = 'supabase_url' limit 1;
      select decrypted_secret into v_service_role_key
        from vault.decrypted_secrets where name = 'service_role_key' limit 1;
    exception when others then
      return 'vault_unavailable';
    end;

    if v_supabase_url is null or v_service_role_key is null then
      return 'missing_secrets';
    end if;

    perform net.http_post(
      url := v_supabase_url || '/functions/v1/' || v_rule.edge_function_name,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_role_key
      ),
      body := jsonb_build_object(
        'rule_id', p_rule_id::text,
        'title', v_rule.title,
        'description', v_rule.description
      )
    );
    return 'edge_function_called';
  end if;

  return 'no_source';
end;
$$;

-- =============================================================================
-- Rule <-> Cron Job Sync (only if pg_cron is available)
-- =============================================================================

create or replace function _supabase_advisors.sync_rule_cron()
returns trigger
language plpgsql
security definer
as $$
declare
  v_job_name text;
  v_has_cron boolean;
begin
  select exists(select 1 from pg_extension where extname = 'pg_cron') into v_has_cron;
  if not v_has_cron then return coalesce(NEW, OLD); end if;

  if TG_OP = 'DELETE' then
    v_job_name := 'advisor_rule_' || OLD.id::text;
    begin
      perform cron.unschedule(v_job_name);
    exception when others then null;
    end;
    return OLD;
  end if;

  v_job_name := 'advisor_rule_' || NEW.id::text;

  begin
    perform cron.unschedule(v_job_name);
  exception when others then null;
  end;

  if NEW.is_enabled then
    perform cron.schedule(
      v_job_name,
      NEW.schedule,
      format('select _supabase_advisors.execute_rule(%L::uuid)', NEW.id)
    );
  end if;

  return NEW;
end;
$$;

create trigger sync_rule_cron_trigger
  after insert or update or delete on _supabase_advisors.rules
  for each row execute function _supabase_advisors.sync_rule_cron();

-- =============================================================================
-- Agent Task Execution (pg_net + vault required)
-- =============================================================================

create or replace function _supabase_advisors.execute_agent_task(p_task_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_task record;
  v_conversation_id uuid;
  v_message_id text;
  v_supabase_url text;
  v_service_role_key text;
  v_payload jsonb;
  v_has_pg_net boolean;
begin
  select * into v_task
    from _supabase_advisors.agent_tasks
    where id = p_task_id and enabled = true;

  if not found then return; end if;
  if v_task.agent_id is null then return; end if;

  select exists(select 1 from pg_extension where extname = 'pg_net') into v_has_pg_net;
  if not v_has_pg_net then
    raise notice 'pg_net not available — skipping agent task %', p_task_id;
    return;
  end if;

  if v_task.is_unique then
    select id into v_conversation_id
      from _supabase_advisors.conversations
      where task_id = p_task_id
      order by created_at desc limit 1;
  end if;

  if v_conversation_id is null then
    v_conversation_id := gen_random_uuid();
  end if;

  v_message_id := 'msg-' || replace(gen_random_uuid()::text, '-', '');

  begin
    select decrypted_secret into v_supabase_url
      from vault.decrypted_secrets where name = 'supabase_url' limit 1;
    select decrypted_secret into v_service_role_key
      from vault.decrypted_secrets where name = 'service_role_key' limit 1;
  exception when others then
    raise notice 'vault not available — skipping agent task %', p_task_id;
    return;
  end;

  if v_supabase_url is null or v_service_role_key is null then return; end if;

  v_payload := jsonb_build_object(
    'message', jsonb_build_object(
      'id', v_message_id,
      'role', 'system',
      'parts', jsonb_build_array(
        jsonb_build_object('type', 'text', 'text', v_task.description)
      ),
      'createdAt', now()::text
    ),
    'conversation_id', v_conversation_id::text,
    'agent_id', v_task.agent_id::text,
    'task_id', p_task_id::text,
    'persist', true
  );

  perform net.http_post(
    url := v_supabase_url || '/functions/v1/advisors-chat',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_role_key,
      'x-internal-no-stream', '1'
    ),
    body := v_payload
  );
end;
$$;

-- =============================================================================
-- Agent Task <-> Cron Job Sync (only if pg_cron is available)
-- =============================================================================

create or replace function _supabase_advisors.sync_agent_task_cron()
returns trigger
language plpgsql
security definer
as $$
declare
  v_job_name text;
  v_has_cron boolean;
begin
  select exists(select 1 from pg_extension where extname = 'pg_cron') into v_has_cron;
  if not v_has_cron then return coalesce(NEW, OLD); end if;

  if TG_OP = 'DELETE' then
    v_job_name := 'advisor_task_' || OLD.id::text;
    begin
      perform cron.unschedule(v_job_name);
    exception when others then null;
    end;
    return OLD;
  end if;

  v_job_name := 'advisor_task_' || NEW.id::text;

  begin
    perform cron.unschedule(v_job_name);
  exception when others then null;
  end;

  if NEW.enabled then
    perform cron.schedule(
      v_job_name,
      NEW.schedule,
      format('select _supabase_advisors.execute_agent_task(%L::uuid)', NEW.id)
    );
  end if;

  return NEW;
end;
$$;

create trigger sync_agent_task_cron_trigger
  after insert or update or delete on _supabase_advisors.agent_tasks
  for each row execute function _supabase_advisors.sync_agent_task_cron();

-- =============================================================================
-- Realtime (safe: ignores errors if publication doesn't exist locally)
-- =============================================================================

do $$ begin
  alter publication supabase_realtime add table _supabase_advisors.issues;
exception when others then
  raise notice 'Could not add issues to supabase_realtime publication: %', SQLERRM;
end $$;

do $$ begin
  alter publication supabase_realtime add table _supabase_advisors.alerts;
exception when others then
  raise notice 'Could not add alerts to supabase_realtime publication: %', SQLERRM;
end $$;

-- =============================================================================
-- Remediation Actions and Cross-Signal Correlation
-- =============================================================================

-- View: correlated issues (issues that share the same table or schema in metadata)
create or replace view _supabase_advisors.correlated_issues as
select
  a.id as issue_a_id,
  a.title as issue_a_title,
  b.id as issue_b_id,
  b.title as issue_b_title,
  a.category as category_a,
  b.category as category_b,
  case
    when a.metadata->>'schema' = b.metadata->>'schema'
      and a.metadata->>'name' = b.metadata->>'name'
    then 'same_table'
    when a.metadata->>'schema' = b.metadata->>'schema'
    then 'same_schema'
    else 'related'
  end as correlation_type
from _supabase_advisors.issues a
join _supabase_advisors.issues b on a.id < b.id
where a.status in ('open', 'acknowledged', 'snoozed')
  and b.status in ('open', 'acknowledged', 'snoozed')
  and (
    (a.metadata->>'schema' is not null and a.metadata->>'schema' = b.metadata->>'schema')
    or (a.dedup_key = b.dedup_key and a.category != b.category)
  );

-- Function: get correlated issues for a specific issue
create or replace function _supabase_advisors.get_correlated_issues(p_issue_id uuid)
returns table (
  related_issue_id uuid,
  related_title text,
  related_severity text,
  related_category text,
  correlation_type text
)
language sql
stable
as $$
  select
    case when issue_a_id = p_issue_id then issue_b_id else issue_a_id end,
    case when issue_a_id = p_issue_id then issue_b_title else issue_a_title end,
    i.severity,
    i.category,
    ci.correlation_type
  from _supabase_advisors.correlated_issues ci
  join _supabase_advisors.issues i on i.id = case when ci.issue_a_id = p_issue_id then ci.issue_b_id else ci.issue_a_id end
  where ci.issue_a_id = p_issue_id or ci.issue_b_id = p_issue_id;
$$;

-- Function: bulk resolve all alerts linked to an issue
create or replace function _supabase_advisors.resolve_issue_with_reason(
  p_issue_id uuid,
  p_reason text default 'resolved by user',
  p_resolved_by text default 'user'
)
returns _supabase_advisors.issues
language plpgsql
as $$
declare
  v_issue _supabase_advisors.issues;
begin
  update _supabase_advisors.issues
  set status = 'resolved',
      resolved_at = now(),
      resolved_by = p_resolved_by,
      actions_taken = actions_taken || jsonb_build_array(
        jsonb_build_object(
          'type', 'resolve',
          'label', p_reason,
          'taken_at', now()::text,
          'taken_by', p_resolved_by
        )
      )
  where id = p_issue_id
  returning * into v_issue;

  return v_issue;
end;
$$;

-- Function: auto-generate remediation SQL for known lint patterns
create or replace function _supabase_advisors.generate_remediation_sql(p_rule_name text, p_metadata jsonb)
returns text
language plpgsql
immutable
as $$
begin
  case p_rule_name
    when 'rls_disabled_in_public' then
      return format(
        'ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY;',
        p_metadata->>'schema',
        p_metadata->>'name'
      );
    when 'unindexed_foreign_keys' then
      return format(
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_%s_%s ON %I.%I (%s);',
        p_metadata->>'name',
        p_metadata->>'fkey_name',
        p_metadata->>'schema',
        p_metadata->>'name',
        coalesce(p_metadata->>'fkey_columns', 'id')
      );
    when 'duplicate_index' then
      return format(
        'DROP INDEX IF EXISTS %I.%I;',
        p_metadata->>'schema',
        p_metadata->>'index_name'
      );
    when 'extension_in_public' then
      return format(
        'ALTER EXTENSION %I SET SCHEMA extensions;',
        p_metadata->>'extension_name'
      );
    when 'policy_exists_rls_disabled' then
      return format(
        'ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY;',
        p_metadata->>'schema',
        p_metadata->>'name'
      );
    else
      return null;
  end case;
end;
$$;

-- Issue summary statistics view (for dashboard widgets)
create or replace view _supabase_advisors.issue_summary as
select
  count(*) filter (where status in ('open', 'acknowledged', 'snoozed')) as open_count,
  count(*) filter (where status in ('open', 'acknowledged', 'snoozed') and severity = 'critical') as critical_count,
  count(*) filter (where status in ('open', 'acknowledged', 'snoozed') and severity = 'warning') as warning_count,
  count(*) filter (where status in ('open', 'acknowledged', 'snoozed') and severity = 'info') as info_count,
  count(*) filter (where status = 'resolved') as resolved_count,
  count(*) filter (where status in ('open', 'acknowledged', 'snoozed') and category = 'security') as security_count,
  count(*) filter (where status in ('open', 'acknowledged', 'snoozed') and category = 'performance') as performance_count
from _supabase_advisors.issues;

import type { IssueCheckDefinition, IssueSeverity } from '../issue-schema'
import { lintInfoMap } from '@/components/interfaces/Linter/Linter.utils'

// The check catalog the mock serves. The backend will own these definitions; the values
// here are a plausible starting point, not tuned policy.

// Check descriptions for the settings prototype, including checks without an open issue.
const ISSUE_CHECK_SUMMARIES: Record<string, string> = {
  unindexed_foreign_keys:
    'Finds foreign keys without a supporting index, which can slow down joins and deletes.',
  auth_users_exposed: 'Finds views that expose auth.users data through the API.',
  auth_rls_initplan:
    'Finds row-level security policies that evaluate Auth functions for every row.',
  no_primary_key: 'Finds tables without a primary key to identify each row.',
  unused_index: 'Finds indexes that are not being used by queries.',
  multiple_permissive_policies:
    'Finds overlapping permissive policies that add work to each query.',
  policy_exists_rls_disabled:
    'Finds tables with policies that are not enforced because row-level security is off.',
  rls_enabled_no_policy:
    'Finds tables with row-level security enabled but no policies to allow access.',
  duplicate_index:
    'Finds indexes that cover the same columns and add unnecessary storage and write overhead.',
  security_definer_view:
    'Finds views that run with their owner’s permissions instead of the caller’s.',
  function_search_path_mutable:
    'Finds functions without a fixed search path, which can resolve objects in unintended schemas.',
  auth_allow_anonymous_sign_ins: 'Checks whether users can sign in anonymously.',
  rls_disabled_in_public: 'Finds tables in the public schema without row-level security enabled.',
  extension_in_public: 'Finds extensions installed in the public schema.',
  auth_otp_long_expiry: 'Checks whether one-time passwords remain valid for too long.',
  auth_otp_short_length: 'Checks whether one-time passwords are too short.',
  auth_db_connections_absolute:
    'Checks whether Auth uses a fixed connection limit instead of scaling with the database.',
  rls_references_user_metadata:
    'Finds policies that rely on user metadata that users can change themselves.',
  materialized_view_in_api:
    'Finds materialized views exposed through the API without row-level security protection.',
  foreign_table_in_api:
    'Finds foreign tables exposed through the API without row-level security protection.',
  unsupported_reg_types:
    'Finds columns using Postgres object identifier types that the API does not support.',
  ssl_not_enforced: 'Checks whether database clients can connect without SSL.',
  network_restrictions_not_set:
    'Checks whether database access is limited to approved IP addresses.',
  password_requirements_min_length:
    'Checks whether the minimum password length meets the recommended requirement.',
  pitr_not_enabled: 'Checks whether point-in-time recovery is enabled for the project.',
  pitr_archiving_stale:
    'Checks whether database changes are still being archived for point-in-time recovery.',
  auth_leaked_password_protection:
    'Checks whether Auth rejects passwords found in known data breaches.',
  auth_insufficient_mfa_options:
    'Checks whether users have enough multi-factor authentication options available.',
  auth_password_policy_missing: 'Checks whether a password policy is configured for Auth.',
  leaked_service_key: 'Looks for service role keys exposed in public sources.',
  no_backup_admin:
    'Checks whether another organization owner is available if the primary owner loses access.',
  vulnerable_postgres_version:
    'Checks whether security patches are available for the project’s Postgres version.',
  sensitive_columns_exposed:
    'Finds columns containing potentially sensitive data exposed through the API.',
  rls_policy_always_true:
    'Finds row-level security policies that allow access without a meaningful condition.',
  public_bucket_allows_listing:
    'Finds public storage buckets whose contents can be listed without signing in.',
  pg_graphql_anon_table_exposed:
    'Finds tables and views visible in the GraphQL schema without signing in.',
  pg_graphql_authenticated_table_exposed:
    'Finds tables and views visible in the GraphQL schema to signed-in users.',
  anon_security_definer_function_executable:
    'Finds functions that run with elevated permissions and can be called without signing in.',
  authenticated_security_definer_function_executable:
    'Finds functions that run with elevated permissions and can be called by signed-in users.',
  instance_db_down: 'Checks whether the database process is running.',
  db_not_reachable: 'Checks whether the database is reachable and can accept queries.',
  db_connection_limit_reached: 'Checks whether the database has reached its connection limit.',
  log_data_api_error_rate_high: 'Checks for a sustained increase in failed Data API requests.',
  log_auth_error_rate_high: 'Checks for a sustained increase in failed Auth requests.',
  log_storage_error_rate_high: 'Checks for a sustained increase in failed Storage requests.',
  log_edge_function_error_rate_high:
    'Checks for a sustained increase in failed Edge Function requests.',
  instance_alert_firing: 'Checks for active infrastructure alerts affecting the project.',
}

type CheckPolicy = Omit<IssueCheckDefinition, 'id' | 'title' | 'summary' | 'category'>

const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// Lints over current state run hourly and react to a single run: a table either has RLS
// or it doesn't, so there's nothing to smooth out.
const STATE_POLICY: CheckPolicy = {
  kind: 'state',
  default_severity: 'warning',
  interval_seconds: HOUR,
  window_seconds: null,
  fire_after_seconds: 0,
  resolve_after_seconds: 0,
  resolution: 'automatic',
  resolve_issue_after_seconds: 0,
  reopen_window_seconds: null,
}

// Threshold and event checks report incidents: firing again within a day of resolving is the
// same one coming back, and later than that it's a new one
const INCIDENT_REOPEN_WINDOW_SECONDS = DAY

// Error rates flap, so one bad five-minute window doesn't open an affected resource and one good
// window doesn't end it.
const ERROR_RATE_POLICY: CheckPolicy = {
  kind: 'threshold',
  default_severity: 'warning',
  interval_seconds: 5 * MINUTE,
  window_seconds: 5 * MINUTE,
  fire_after_seconds: 5 * MINUTE,
  resolve_after_seconds: 10 * MINUTE,
  resolution: 'automatic',
  // An error rate that settles and comes back within the hour is the same incident
  resolve_issue_after_seconds: HOUR,
  reopen_window_seconds: INCIDENT_REOPEN_WINDOW_SECONDS,
}

const AVAILABILITY_POLICY: CheckPolicy = {
  kind: 'threshold',
  default_severity: 'critical',
  interval_seconds: MINUTE,
  window_seconds: MINUTE,
  fire_after_seconds: 2 * MINUTE,
  resolve_after_seconds: 2 * MINUTE,
  resolution: 'automatic',
  resolve_issue_after_seconds: 30 * MINUTE,
  reopen_window_seconds: INCIDENT_REOPEN_WINDOW_SECONDS,
}

const SEVERITY_OVERRIDES: Record<string, IssueSeverity> = {
  auth_users_exposed: 'critical',
  policy_exists_rls_disabled: 'critical',
  rls_disabled_in_public: 'critical',
  security_definer_view: 'critical',
  sensitive_columns_exposed: 'critical',
  rls_references_user_metadata: 'critical',
  unindexed_foreign_keys: 'info',
  unused_index: 'info',
  no_primary_key: 'info',
}

const POLICY_OVERRIDES: Record<string, Partial<CheckPolicy>> = {
  vulnerable_postgres_version: { interval_seconds: DAY },
  no_backup_admin: { interval_seconds: DAY },
  // A key found in a public source stays leaked after it's taken down, until it's rotated
  leaked_service_key: {
    kind: 'event',
    default_severity: 'critical',
    interval_seconds: DAY,
    resolution: 'manual',
    reopen_window_seconds: INCIDENT_REOPEN_WINDOW_SECONDS,
  },
  instance_db_down: AVAILABILITY_POLICY,
  db_not_reachable: AVAILABILITY_POLICY,
  db_connection_limit_reached: {
    ...AVAILABILITY_POLICY,
    window_seconds: 5 * MINUTE,
    fire_after_seconds: 5 * MINUTE,
    resolve_after_seconds: 5 * MINUTE,
  },
  log_data_api_error_rate_high: ERROR_RATE_POLICY,
  log_auth_error_rate_high: ERROR_RATE_POLICY,
  log_storage_error_rate_high: ERROR_RATE_POLICY,
  log_edge_function_error_rate_high: ERROR_RATE_POLICY,
  // Infrastructure alerts arrive already debounced by the alerting system
  instance_alert_firing: {
    kind: 'threshold',
    interval_seconds: MINUTE,
    reopen_window_seconds: INCIDENT_REOPEN_WINDOW_SECONDS,
  },
}

export const ISSUE_CHECK_DEFINITIONS: IssueCheckDefinition[] = lintInfoMap.map(
  ({ name, title, category }) => ({
    ...STATE_POLICY,
    default_severity: SEVERITY_OVERRIDES[name] ?? STATE_POLICY.default_severity,
    ...POLICY_OVERRIDES[name],
    id: name,
    title,
    summary: ISSUE_CHECK_SUMMARIES[name],
    category,
  })
)

export function getIssueCheckDefinition(checkId: string) {
  return ISSUE_CHECK_DEFINITIONS.find((check) => check.id === checkId)
}

import {
  EXTERNAL_AUTH_PROVIDERS,
  EXTERNAL_AUTH_PROVIDERS_WITH_URL,
  normalizeRedirectUrls,
  type ConfigDriftDashboardConfig,
} from './github-config-field-registry'
import { type GitHubConfigToml } from './github-config.types'

/**
 * Reshapes a project's dashboard config (sections keyed by section name, fields in their
 * dashboard-native naming, e.g. from `GET /v1/projects/:ref/config`) into the nested, dotted-path
 * shape of a parsed config.toml.
 *
 * Not every dashboard field has a config.toml counterpart — untracked fields are simply never read
 * here. See the comments throughout for renames/inversions/unit conversions and for fields that
 * were deliberately left out because config.toml has no equivalent.
 */
export function convertProjectConfigToGitHubConfig(
  dashboardConfig?: ConfigDriftDashboardConfig
): GitHubConfigToml {
  if (!dashboardConfig) return {}

  const database = dashboardConfig.database

  const config: GitHubConfigToml = {
    db: {
      network_restrictions: convertNetworkRestrictions(database?.network_restrictions),
      pooler: convertPooler(dashboardConfig.pooler),
    },
    api: convertApi(dashboardConfig.api),
    auth: convertAuth(dashboardConfig.auth),
    storage: convertStorage(dashboardConfig.storage),
    // realtime: gitHubConfigTomlSchema only models `realtime.enabled`, and the dashboard's realtime
    // section (private_only, max_concurrent_users, max_events_per_second, ...) never provides one —
    // there is nothing to map.
  }
  // database.ssl_enforced: dashboard-only security toggle, not managed via config.toml
  // database.postgres_settings: user-set Postgres GUC overrides, applied directly to the database
  // rather than declared in config.toml

  return pruneUndefined(config) ?? {}
}

/**
 * Every convertX helper always returns every field it knows about, most of them `undefined` when
 * the source dashboard config didn't have that value. Recursively drop `undefined` leaves and the
 * empty objects left behind, so callers only see the fields that actually had a value.
 */
function pruneUndefined<T>(value: T): T | undefined {
  if (value === undefined || Array.isArray(value) || typeof value !== 'object' || value === null) {
    return value === undefined ? undefined : value
  }

  const result: Record<string, unknown> = {}
  for (const [key, nestedValue] of Object.entries(value)) {
    const pruned = pruneUndefined(nestedValue)
    if (pruned !== undefined) result[key] = pruned
  }

  return Object.keys(result).length > 0 ? (result as T) : undefined
}

function convertNetworkRestrictions(
  value: unknown
): NonNullable<NonNullable<GitHubConfigToml['db']>['network_restrictions']> | undefined {
  const restrictions = asRecord(value)
  if (!restrictions) return undefined

  const cidrs = Array.isArray(restrictions.allowed_cidrs) ? restrictions.allowed_cidrs : undefined
  const addressesOfType = (type: string) =>
    cidrs
      ?.map((cidr) => asRecord(cidr))
      .filter((cidr): cidr is Record<string, unknown> => cidr?.type === type)
      .map((cidr) => asString(cidr.address))
      .filter((address): address is string => address !== undefined)

  return {
    // dashboard has no single boolean — derived from `status === 'applied'`. `entitlement` (plan
    // gating) and `status` (rollout state) have no config.toml equivalent.
    enabled: restrictions.status === undefined ? undefined : restrictions.status === 'applied',
    allowed_cidrs: addressesOfType('v4'),
    allowed_cidrs_v6: addressesOfType('v6'),
  }
}

function convertPooler(
  value: unknown
): NonNullable<NonNullable<GitHubConfigToml['db']>['pooler']> | undefined {
  // dashboard's "pooler" is a top-level section; config.toml nests it under `db.pooler`
  const pooler = asRecord(value)
  if (!pooler) return undefined

  return {
    pool_mode: asString(pooler.pool_mode),
    default_pool_size: asNumber(pooler.default_pool_size),
    max_client_conn: asNumber(pooler.max_client_conn),
    // ignore_startup_parameters, server_idle_timeout, server_lifetime, query_wait_timeout,
    // reserve_pool_size: Supavisor-only settings, no config.toml field.
  }
}

function convertApi(value: unknown): GitHubConfigToml['api'] {
  const api = asRecord(value)
  if (!api) return undefined

  return {
    max_rows: asNumber(api.max_rows),
    schemas: splitCommaList(api.db_schema),
    extra_search_path: splitCommaList(api.db_extra_search_path),
    // db_pool, db_pool_acquisition_timeout: no config.toml field.
  }
}

function convertAuth(value: unknown): GitHubConfigToml['auth'] {
  const auth = asRecord(value)
  if (!auth) return undefined

  return {
    site_url: asString(auth.site_url),
    // uri_allow_list is a comma-separated string on the dashboard; config.toml wants a string[]
    additional_redirect_urls: convertRedirectUrls(auth.uri_allow_list),
    jwt_expiry: asNumber(auth.jwt_exp),
    // disable_signup -> enable_signup (inverted boolean)
    enable_signup: invertBoolean(auth.disable_signup),
    enable_manual_linking: asBoolean(auth.security_manual_linking_enabled),
    // refresh_token_rotation_enabled -> enable_refresh_token_rotation (renamed)
    enable_refresh_token_rotation: asBoolean(auth.refresh_token_rotation_enabled),
    // security_refresh_token_reuse_interval -> refresh_token_reuse_interval (renamed)
    refresh_token_reuse_interval: asNumber(auth.security_refresh_token_reuse_interval),
    minimum_password_length: asNumber(auth.password_min_length),
    password_requirements: normalizePasswordRequirements(auth.password_required_characters),
    enable_anonymous_sign_ins: asBoolean(auth.external_anonymous_users_enabled),
    rate_limit: convertAuthRateLimit(auth),
    email: convertAuthEmail(auth),
    sms: convertAuthSms(auth),
    mfa: convertAuthMfa(auth),
    external: convertAuthExternalProviders(auth),
    // external_web3_solana_enabled -> web3.solana.enabled; external_web3_ethereum_enabled has no
    // config.toml field (schema only models solana)
    web3: { solana: { enabled: asBoolean(auth.external_web3_solana_enabled) } },
    oauth_server: {
      enabled: asBoolean(auth.oauth_server_enabled),
      allow_dynamic_registration: asBoolean(auth.oauth_server_allow_dynamic_registration),
      // oauth_server_authorization_path -> authorization_url_path (renamed)
      authorization_url_path: asString(auth.oauth_server_authorization_path),
    },
    // api_max_request_duration, db_max_pool_size(_unit), security_update_password_require_*,
    // audit_log_disable_postgres, sessions_*, hook_*_enabled/uri (secrets are always excluded
    // regardless), nimbus_oauth_client_id, mailer_allow_unverified_email_sign_ins,
    // mailer_notifications_*, password_hibp_enabled, saml_*, security_sb_forwarded_for_enabled,
    // security_captcha_*, sms_test_otp(_valid_until), index_worker_ensure_user_search_indexes_exist,
    // custom_oauth_enabled/max_providers, mailer_subjects_custom_contents,
    // mailer_templates_custom_contents: none of these have a gitHubConfigTomlSchema field.
  }
}

function normalizePasswordRequirements(value: unknown): string | undefined {
  if (value === null || value === 'NO_REQUIRED_CHARS') return ''
  return asString(value)
}

function convertAuthRateLimit(
  auth: Record<string, unknown>
): NonNullable<GitHubConfigToml['auth']>['rate_limit'] {
  return {
    email_sent: asNumber(auth.rate_limit_email_sent),
    sms_sent: asNumber(auth.rate_limit_sms_sent),
    anonymous_users: asNumber(auth.rate_limit_anonymous_users),
    token_refresh: asNumber(auth.rate_limit_token_refresh),
    web3: asNumber(auth.rate_limit_web3),
    // Confirmed against the Auth service source (supabase/auth#2090): the dashboard's
    // RATE_LIMIT_VERIFY backs "rate limit for token verifications" and RATE_LIMIT_OTP backs
    // "rate limit for sign ups and sign ins", despite the naming mismatch.
    token_verifications: asNumber(auth.rate_limit_verify),
    sign_in_sign_ups: asNumber(auth.rate_limit_otp),
  }
}

function convertAuthEmail(
  auth: Record<string, unknown>
): NonNullable<GitHubConfigToml['auth']>['email'] {
  return {
    enable_signup: asBoolean(auth.external_email_enabled),
    // mailer_autoconfirm -> enable_confirmations (inverted boolean)
    enable_confirmations: invertBoolean(auth.mailer_autoconfirm),
    double_confirm_changes: asBoolean(auth.mailer_secure_email_change_enabled),
    otp_length: asNumber(auth.mailer_otp_length),
    otp_expiry: asNumber(auth.mailer_otp_exp),
    // smtp_max_frequency is seconds on the dashboard vs. a duration string ("1m") in config.toml —
    // needs a number -> duration-string conversion, not done here. smtp_pass is a secret, excluded.
    // template subjects/content: dashboard stores literal subject/HTML, config.toml stores
    // `{ subject, content_path }` where content_path is a file path — not convertible without
    // writing the HTML to disk.
  }
}

function convertAuthSms(
  auth: Record<string, unknown>
): NonNullable<GitHubConfigToml['auth']>['sms'] {
  return {
    provider: asString(auth.sms_provider),
    // sms_autoconfirm -> enable_confirmations (inverted boolean)
    enable_confirmations: invertBoolean(auth.sms_autoconfirm),
    otp_expiry: asNumber(auth.sms_otp_exp),
    otp_length: asNumber(auth.sms_otp_length),
    template: asString(auth.sms_template),
    // sms_max_frequency is seconds on the dashboard vs. a duration string in config.toml — needs
    // conversion, not done here.
    twilio: {
      account_sid: asStringOrNull(auth.sms_twilio_account_sid),
      message_service_sid: asStringOrNull(auth.sms_twilio_message_service_sid),
      content_sid: asStringOrNull(auth.sms_twilio_content_sid),
      // auth_token is a secret, excluded
    },
    twilio_verify: {
      account_sid: asStringOrNull(auth.sms_twilio_verify_account_sid),
      message_service_sid: asStringOrNull(auth.sms_twilio_verify_message_service_sid),
      // auth_token is a secret, excluded
    },
    messagebird: { originator: asStringOrNull(auth.sms_messagebird_originator) },
    textlocal: { sender: asStringOrNull(auth.sms_textlocal_sender) },
    vonage: { from: asStringOrNull(auth.sms_vonage_from) },
  }
}

function convertAuthMfa(
  auth: Record<string, unknown>
): NonNullable<GitHubConfigToml['auth']>['mfa'] {
  return {
    max_enrolled_factors: asNumber(auth.mfa_max_enrolled_factors),
    totp: {
      enroll_enabled: asBoolean(auth.mfa_totp_enroll_enabled),
      verify_enabled: asBoolean(auth.mfa_totp_verify_enabled),
    },
    phone: {
      enroll_enabled: asBoolean(auth.mfa_phone_enroll_enabled),
      verify_enabled: asBoolean(auth.mfa_phone_verify_enabled),
      otp_length: asNumber(auth.mfa_phone_otp_length),
      template: asString(auth.mfa_phone_template),
      // mfa_phone_max_frequency is seconds on the dashboard vs. a duration string in config.toml —
      // needs conversion, not done here.
    },
    // mfa_allow_low_aal, mfa_web_authn_enroll_enabled, mfa_web_authn_verify_enabled,
    // passkey_enabled, webauthn_rp_*: no config.toml field.
  }
}

function convertAuthExternalProviders(
  auth: Record<string, unknown>
): NonNullable<GitHubConfigToml['auth']>['external'] {
  const providers: Record<string, Record<string, unknown>> = {}

  for (const provider of EXTERNAL_AUTH_PROVIDERS) {
    providers[provider] = {
      enabled: asBoolean(auth[`external_${provider}_enabled`]),
      client_id: asStringOrNull(auth[`external_${provider}_client_id`]),
      email_optional: asBoolean(auth[`external_${provider}_email_optional`]),
      skip_nonce_check: asBoolean(auth[`external_${provider}_skip_nonce_check`]),
      ...(EXTERNAL_AUTH_PROVIDERS_WITH_URL.has(provider)
        ? { url: asStringOrNull(auth[`external_${provider}_url`]) }
        : {}),
    }
  }

  // external_apple_additional_client_ids, external_google_additional_client_ids,
  // external_google_skip_nonce_check: dashboard-only extensions with no config.toml field.

  return providers
}

function convertStorage(value: unknown): GitHubConfigToml['storage'] {
  const storage = asRecord(value)
  if (!storage) return undefined

  const features = asRecord(storage.features)
  const s3Protocol = asRecord(features?.s3_protocol)
  // features.iceberg_catalog -> analytics (renamed)
  const icebergCatalog = asRecord(features?.iceberg_catalog)
  // features.vector_buckets -> vector (renamed)
  const vectorBuckets = asRecord(features?.vector_buckets)

  return {
    file_size_limit: asNumber(storage.file_size_limit),
    s3_protocol: { enabled: asBoolean(s3Protocol?.enabled) },
    analytics: {
      enabled: asBoolean(icebergCatalog?.enabled),
      max_namespaces: asNumber(icebergCatalog?.max_namespaces),
      max_tables: asNumber(icebergCatalog?.max_tables),
      max_catalogs: asNumber(icebergCatalog?.max_catalogs),
    },
    vector: {
      enabled: asBoolean(vectorBuckets?.enabled),
      max_buckets: asNumber(vectorBuckets?.max_buckets),
      max_indexes: asNumber(vectorBuckets?.max_indexes),
    },
    // features.image_transformation.enabled, features.purge_cache.enabled: no config.toml field.
    // capabilities.list_v2, capabilities.iceberg_catalog: read-only capability flags, not settings.
    // upstream_target, migration_version: internal infra bookkeeping.
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function asStringOrNull(value: unknown): string | null | undefined {
  return value === null ? null : asString(value)
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function invertBoolean(value: unknown): boolean | undefined {
  const bool = asBoolean(value)
  return bool === undefined ? undefined : !bool
}

/**
 * Unlike the other comma-separated lists (`api.schemas`, `api.extra_search_path`) whose order is
 * meaningful, a redirect allow-list is a set. Dedupe and sort it here so a list that differs from
 * config.toml only in ordering isn't reported as drift — `getConfigFieldState` compares with
 * `JSON.stringify`, which is order-sensitive.
 */
function convertRedirectUrls(value: unknown): string[] | undefined {
  const urls = splitCommaList(value)
  if (urls === undefined) return undefined

  return normalizeRedirectUrls(urls)
}

function splitCommaList(value: unknown): string[] | undefined {
  const raw = asString(value)
  if (raw === undefined) return undefined
  if (raw.trim() === '') return []
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

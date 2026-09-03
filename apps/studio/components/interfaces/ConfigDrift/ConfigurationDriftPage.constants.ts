import { fromConfigDocument, getDefaultCliConfig, type ProjectConfig } from '@supabase/config'
import { isPlainObject } from 'lodash'

// The field-lookup and settingHref/label registry below is still hand-rolled. @supabase/config's
// `fromApiProjectConfig`/`fromConfigDocument`/`diffProjectConfig` (called from github-config-drift.ts)
// own the section/field mapping, secret omission, and comparison; what's left here has no package
// equivalent — `settingHref`/`label` are Studio-only concepts.

export const DEFAULT_PROJECT_CONFIG = fromConfigDocument(getDefaultCliConfig())

export const CONFIG_SECTIONS = Object.keys(DEFAULT_PROJECT_CONFIG) as Exclude<
  keyof ProjectConfig,
  '_apiResponse'
>[]
export type ConfigSection = (typeof CONFIG_SECTIONS)[number]

interface ConfigFieldDefinition {
  settingHref: (projectRef: string) => string
  label: string
}

export type ResolvedConfigFieldDefinition = ConfigFieldDefinition & { configPath: string }

export const toProjectHomepageHref = (projectRef: string) => `/project/${projectRef}`
const toAuthUrlConfigHref = (projectRef: string) => `/project/${projectRef}/auth/url-configuration`
const toAuthProvidersHref = (provider?: string) => (projectRef: string) =>
  `/project/${projectRef}/auth/providers${provider ? `/${provider}` : ''}`
const toApiSettingsHref = (projectRef: string) => `/project/${projectRef}/settings/api`
const toAuthProtectionHref = (projectRef: string) => `/project/${projectRef}/auth/protection`
const toDataApiSettingsHref = (projectRef: string) =>
  `/project/${projectRef}/integrations/data_api/settings`
const toStorageSettingsHref = (projectRef: string) =>
  `/project/${projectRef}/storage/files/settings`
const toProjectHref = (projectRef: string) => `/project/${projectRef}`
const toAuthTemplatesHref = (projectRef: string) => `/project/${projectRef}/auth/templates`

/**
 * Every trackable field across every section, keyed by its config.toml dotted path — the same shape
 * `getFieldDefinition`/`getSectionFieldEntries` address.
 */
// Entries with no dedicated Studio settings page fall back to `toProjectHref`.
export const CONFIG_FIELD_REGISTRY: Record<string, ConfigFieldDefinition> = {
  'analytics.backend': { settingHref: toProjectHref, label: 'Analytics backend' },
  'analytics.enabled': { settingHref: toProjectHref, label: 'Analytics enabled' },
  'analytics.port': { settingHref: toProjectHref, label: 'Analytics port' },
  'api.enabled': { settingHref: toDataApiSettingsHref, label: 'API enabled' },
  'api.extra_search_path': { settingHref: toDataApiSettingsHref, label: 'Extra search path' },
  'api.max_rows': { settingHref: toDataApiSettingsHref, label: 'Max rows' },
  'api.port': { settingHref: toDataApiSettingsHref, label: 'API port' },
  'api.schemas': { settingHref: toDataApiSettingsHref, label: 'Exposed schemas' },
  'api.tls.enabled': { settingHref: toDataApiSettingsHref, label: 'Enforce TLS' },
  'auth.additional_redirect_urls': { settingHref: toAuthUrlConfigHref, label: 'Redirect URLs' },
  'auth.captcha.enabled': { settingHref: toAuthProtectionHref, label: 'Captcha enabled' },
  'auth.email.double_confirm_changes': {
    settingHref: toAuthTemplatesHref,
    label: 'Secure email change',
  },
  'auth.email.enable_confirmations': {
    settingHref: toAuthTemplatesHref,
    label: 'Email confirmations',
  },
  'auth.email.enable_signup': { settingHref: toAuthTemplatesHref, label: 'Email signups' },
  'auth.email.max_frequency': {
    settingHref: toAuthTemplatesHref,
    label: 'Email send frequency limit',
  },
  'auth.email.notification.email_changed.enabled': {
    settingHref: toAuthTemplatesHref,
    label: 'Email changed notification enabled',
  },
  'auth.email.notification.email_changed.subject': {
    settingHref: toAuthTemplatesHref,
    label: 'Email changed notification subject',
  },
  'auth.email.notification.identity_linked.enabled': {
    settingHref: toAuthTemplatesHref,
    label: 'Identity linked notification enabled',
  },
  'auth.email.notification.identity_linked.subject': {
    settingHref: toAuthTemplatesHref,
    label: 'Identity linked notification subject',
  },
  'auth.email.notification.identity_unlinked.enabled': {
    settingHref: toAuthTemplatesHref,
    label: 'Identity unlinked notification enabled',
  },
  'auth.email.notification.identity_unlinked.subject': {
    settingHref: toAuthTemplatesHref,
    label: 'Identity unlinked notification subject',
  },
  'auth.email.notification.mfa_factor_enrolled.enabled': {
    settingHref: toAuthTemplatesHref,
    label: 'MFA factor enrolled notification enabled',
  },
  'auth.email.notification.mfa_factor_enrolled.subject': {
    settingHref: toAuthTemplatesHref,
    label: 'MFA factor enrolled notification subject',
  },
  'auth.email.notification.mfa_factor_unenrolled.enabled': {
    settingHref: toAuthTemplatesHref,
    label: 'MFA factor unenrolled notification enabled',
  },
  'auth.email.notification.mfa_factor_unenrolled.subject': {
    settingHref: toAuthTemplatesHref,
    label: 'MFA factor unenrolled notification subject',
  },
  'auth.email.notification.password_changed.enabled': {
    settingHref: toAuthTemplatesHref,
    label: 'Password changed notification enabled',
  },
  'auth.email.notification.password_changed.subject': {
    settingHref: toAuthTemplatesHref,
    label: 'Password changed notification subject',
  },
  'auth.email.notification.phone_changed.enabled': {
    settingHref: toAuthTemplatesHref,
    label: 'Phone changed notification enabled',
  },
  'auth.email.notification.phone_changed.subject': {
    settingHref: toAuthTemplatesHref,
    label: 'Phone changed notification subject',
  },
  'auth.email.otp_expiry': { settingHref: toAuthProvidersHref('email'), label: 'Email OTP expiry' },
  'auth.email.otp_length': { settingHref: toAuthProvidersHref(), label: 'Email OTP length' },
  'auth.email.secure_password_change': { settingHref: toProjectHref, label: 'Secure email change' },
  'auth.email.smtp.enabled': { settingHref: toProjectHref, label: 'Custom SMTP enabled' },
  'auth.email.template.confirmation.subject': {
    settingHref: toProjectHref,
    label: 'Confirmation email subject',
  },
  'auth.email.template.email_change.subject': {
    settingHref: toProjectHref,
    label: 'Email change email subject',
  },
  'auth.email.template.invite.subject': {
    settingHref: toProjectHref,
    label: 'Invite email subject',
  },
  'auth.email.template.magic_link.subject': {
    settingHref: toProjectHref,
    label: 'Magic link email subject',
  },
  'auth.email.template.reauthentication.subject': {
    settingHref: toProjectHref,
    label: 'Reauthentication email subject',
  },
  'auth.email.template.recovery.subject': {
    settingHref: toProjectHref,
    label: 'Recovery email subject',
  },
  'auth.enable_anonymous_sign_ins': {
    settingHref: toAuthProvidersHref(),
    label: 'Anonymous sign-ins',
  },
  'auth.enable_manual_linking': {
    settingHref: toAuthProvidersHref(),
    label: 'Manual account linking',
  },
  'auth.enable_refresh_token_rotation': {
    settingHref: toProjectHref,
    label: 'Refresh token rotation',
  },
  'auth.enable_signup': { settingHref: toAuthProvidersHref(), label: 'New user signups' },
  'auth.enabled': { settingHref: toProjectHref, label: 'Auth enabled' },
  // external_<provider>_enabled/client_id/email_optional/skip_nonce_check is the dashboard's flat
  // naming for every OAuth provider; a handful of self-hosted providers also expose `_url`.
  // external_<provider>_secret is always a secret and is never read here.
  'auth.external.apple.client_id': {
    settingHref: toAuthProvidersHref('apple'),
    label: 'Apple client ID',
  },
  'auth.external.apple.email_optional': {
    settingHref: toAuthProvidersHref('apple'),
    label: 'Apple email optional',
  },
  'auth.external.apple.enabled': {
    settingHref: toAuthProvidersHref('apple'),
    label: 'Apple enabled',
  },
  'auth.external.apple.skip_nonce_check': {
    settingHref: toAuthProvidersHref('apple'),
    label: 'Apple skip nonce check',
  },
  'auth.external.azure.client_id': {
    settingHref: toAuthProvidersHref('azure'),
    label: 'Azure client ID',
  },
  'auth.external.azure.email_optional': {
    settingHref: toAuthProvidersHref('apple'),
    label: 'Azure email optional',
  },
  'auth.external.azure.enabled': {
    settingHref: toAuthProvidersHref('azure'),
    label: 'Azure enabled',
  },
  'auth.external.azure.skip_nonce_check': {
    settingHref: toAuthProvidersHref('azure'),
    label: 'Azure skip nonce check',
  },
  'auth.external.azure.url': { settingHref: toAuthProvidersHref('azure'), label: 'Azure URL' },
  'auth.external.bitbucket.client_id': {
    settingHref: toAuthProvidersHref('bitbucket'),
    label: 'Bitbucket client ID',
  },
  'auth.external.bitbucket.email_optional': {
    settingHref: toAuthProvidersHref('bitbucket'),
    label: 'Bitbucket email optional',
  },
  'auth.external.bitbucket.enabled': {
    settingHref: toAuthProvidersHref('bitbucket'),
    label: 'Bitbucket enabled',
  },
  'auth.external.bitbucket.skip_nonce_check': {
    settingHref: toAuthProvidersHref('bitbucket'),
    label: 'Bitbucket skip nonce check',
  },
  'auth.external.discord.client_id': {
    settingHref: toAuthProvidersHref('discord'),
    label: 'Discord client ID',
  },
  'auth.external.discord.email_optional': {
    settingHref: toAuthProvidersHref('discord'),
    label: 'Discord email optional',
  },
  'auth.external.discord.enabled': {
    settingHref: toAuthProvidersHref('discord'),
    label: 'Discord enabled',
  },
  'auth.external.discord.skip_nonce_check': {
    settingHref: toAuthProvidersHref('discord'),
    label: 'Discord skip nonce check',
  },
  'auth.external.facebook.client_id': {
    settingHref: toAuthProvidersHref('facebook'),
    label: 'Facebook client ID',
  },
  'auth.external.facebook.email_optional': {
    settingHref: toAuthProvidersHref('facebook'),
    label: 'Facebook email optional',
  },
  'auth.external.facebook.enabled': {
    settingHref: toAuthProvidersHref('facebook'),
    label: 'Facebook enabled',
  },
  'auth.external.facebook.skip_nonce_check': {
    settingHref: toAuthProvidersHref('facebook'),
    label: 'Facebook skip nonce check',
  },
  'auth.external.figma.client_id': {
    settingHref: toAuthProvidersHref('figma'),
    label: 'Figma client ID',
  },
  'auth.external.figma.email_optional': {
    settingHref: toAuthProvidersHref('figma'),
    label: 'Figma email optional',
  },
  'auth.external.figma.enabled': {
    settingHref: toAuthProvidersHref('figma'),
    label: 'Figma enabled',
  },
  'auth.external.figma.skip_nonce_check': {
    settingHref: toAuthProvidersHref('figma'),
    label: 'Figma skip nonce check',
  },
  'auth.external.github.client_id': {
    settingHref: toAuthProvidersHref('github'),
    label: 'GitHub client ID',
  },
  'auth.external.github.email_optional': {
    settingHref: toAuthProvidersHref('github'),
    label: 'GitHub email optional',
  },
  'auth.external.github.enabled': {
    settingHref: toAuthProvidersHref('github'),
    label: 'GitHub enabled',
  },
  'auth.external.github.skip_nonce_check': {
    settingHref: toAuthProvidersHref('github'),
    label: 'GitHub skip nonce check',
  },
  'auth.external.gitlab.client_id': {
    settingHref: toAuthProvidersHref('gitlab'),
    label: 'GitLab client ID',
  },
  'auth.external.gitlab.email_optional': {
    settingHref: toAuthProvidersHref('gitlab'),
    label: 'GitLab email optional',
  },
  'auth.external.gitlab.enabled': {
    settingHref: toAuthProvidersHref('gitlab'),
    label: 'GitLab enabled',
  },
  'auth.external.gitlab.skip_nonce_check': {
    settingHref: toAuthProvidersHref('gitlab'),
    label: 'GitLab skip nonce check',
  },
  'auth.external.gitlab.url': { settingHref: toAuthProvidersHref('gitlab'), label: 'GitLab URL' },
  'auth.external.google.client_id': {
    settingHref: toAuthProvidersHref('google'),
    label: 'Google client ID',
  },
  'auth.external.google.email_optional': {
    settingHref: toAuthProvidersHref('google'),
    label: 'Google email optional',
  },
  'auth.external.google.enabled': {
    settingHref: toAuthProvidersHref('google'),
    label: 'Google enabled',
  },
  'auth.external.google.skip_nonce_check': {
    settingHref: toAuthProvidersHref('google'),
    label: 'Google skip nonce check',
  },
  'auth.external.kakao.client_id': {
    settingHref: toAuthProvidersHref('kakao'),
    label: 'Kakao client ID',
  },
  'auth.external.kakao.email_optional': {
    settingHref: toAuthProvidersHref('kakao'),
    label: 'Kakao email optional',
  },
  'auth.external.kakao.enabled': {
    settingHref: toAuthProvidersHref('kakao'),
    label: 'Kakao enabled',
  },
  'auth.external.kakao.skip_nonce_check': {
    settingHref: toAuthProvidersHref('kakao'),
    label: 'Kakao skip nonce check',
  },
  'auth.external.keycloak.client_id': {
    settingHref: toAuthProvidersHref('keycloak'),
    label: 'Keycloak client ID',
  },
  'auth.external.keycloak.email_optional': {
    settingHref: toAuthProvidersHref('keycloak'),
    label: 'Keycloak email optional',
  },
  'auth.external.keycloak.enabled': {
    settingHref: toAuthProvidersHref('keycloak'),
    label: 'Keycloak enabled',
  },
  'auth.external.keycloak.skip_nonce_check': {
    settingHref: toAuthProvidersHref('keycloak'),
    label: 'Keycloak skip nonce check',
  },
  'auth.external.keycloak.url': {
    settingHref: toAuthProvidersHref('keycloak'),
    label: 'Keycloak URL',
  },
  'auth.external.linkedin_oidc.client_id': {
    settingHref: toAuthProvidersHref('LinkedIn+(OIDC)'),
    label: 'LinkedIn (OIDC) client ID',
  },
  'auth.external.linkedin_oidc.email_optional': {
    settingHref: toAuthProvidersHref('LinkedIn+(OIDC)'),
    label: 'LinkedIn (OIDC) email optional',
  },
  'auth.external.linkedin_oidc.enabled': {
    settingHref: toAuthProvidersHref('LinkedIn+(OIDC)'),
    label: 'LinkedIn (OIDC) enabled',
  },
  'auth.external.linkedin_oidc.skip_nonce_check': {
    settingHref: toAuthProvidersHref('LinkedIn+(OIDC)'),
    label: 'LinkedIn (OIDC) skip nonce check',
  },
  'auth.external.notion.client_id': {
    settingHref: toAuthProvidersHref('notion'),
    label: 'Notion client ID',
  },
  'auth.external.notion.email_optional': {
    settingHref: toAuthProvidersHref('notion'),
    label: 'Notion email optional',
  },
  'auth.external.notion.enabled': {
    settingHref: toAuthProvidersHref('notion'),
    label: 'Notion enabled',
  },
  'auth.external.notion.skip_nonce_check': {
    settingHref: toAuthProvidersHref('notion'),
    label: 'Notion skip nonce check',
  },
  'auth.external.slack.client_id': {
    settingHref: toAuthProvidersHref('slack+(deprecated)'),
    label: 'Slack client ID',
  },
  'auth.external.slack.email_optional': {
    settingHref: toAuthProvidersHref('slack+(deprecated)'),
    label: 'Slack email optional',
  },
  'auth.external.slack.enabled': {
    settingHref: toAuthProvidersHref('slack+(deprecated)'),
    label: 'Slack enabled',
  },
  'auth.external.slack.skip_nonce_check': {
    settingHref: toAuthProvidersHref('slack+(deprecated)'),
    label: 'Slack skip nonce check',
  },
  'auth.external.slack_oidc.client_id': {
    settingHref: toAuthProvidersHref('slack+(OIDC)'),
    label: 'Slack (OIDC) client ID',
  },
  'auth.external.slack_oidc.email_optional': {
    settingHref: toAuthProvidersHref('slack+(OIDC)'),
    label: 'Slack (OIDC) email optional',
  },
  'auth.external.slack_oidc.enabled': {
    settingHref: toAuthProvidersHref('slack+(OIDC)'),
    label: 'Slack (OIDC) enabled',
  },
  'auth.external.slack_oidc.skip_nonce_check': {
    settingHref: toAuthProvidersHref('slack+(OIDC)'),
    label: 'Slack (OIDC) skip nonce check',
  },
  'auth.external.spotify.client_id': {
    settingHref: toAuthProvidersHref('spotify'),
    label: 'Spotify client ID',
  },
  'auth.external.spotify.email_optional': {
    settingHref: toAuthProvidersHref('spotify'),
    label: 'Spotify email optional',
  },
  'auth.external.spotify.enabled': {
    settingHref: toAuthProvidersHref('spotify'),
    label: 'Spotify enabled',
  },
  'auth.external.spotify.skip_nonce_check': {
    settingHref: toAuthProvidersHref('spotify'),
    label: 'Spotify skip nonce check',
  },
  'auth.external.twitch.client_id': {
    settingHref: toAuthProvidersHref('twitch'),
    label: 'Twitch client ID',
  },
  'auth.external.twitch.email_optional': {
    settingHref: toAuthProvidersHref('twitch'),
    label: 'Twitch email optional',
  },
  'auth.external.twitch.enabled': {
    settingHref: toAuthProvidersHref('twitch'),
    label: 'Twitch enabled',
  },
  'auth.external.twitch.skip_nonce_check': {
    settingHref: toAuthProvidersHref('twitch'),
    label: 'Twitch skip nonce check',
  },
  'auth.external.twitter.client_id': {
    settingHref: toAuthProvidersHref('twitter+(deprecated)'),
    label: 'Twitter client ID',
  },
  'auth.external.twitter.email_optional': {
    settingHref: toAuthProvidersHref('twitter+(deprecated)'),
    label: 'Twitter email optional',
  },
  'auth.external.twitter.enabled': {
    settingHref: toAuthProvidersHref('twitter+(deprecated)'),
    label: 'Twitter enabled',
  },
  'auth.external.twitter.skip_nonce_check': {
    settingHref: toAuthProvidersHref('twitter+(deprecated)'),
    label: 'Twitter skip nonce check',
  },
  'auth.external.x.enabled': {
    settingHref: toAuthProvidersHref('x+/+twitter+(oauth+2.0)'),
    label: 'X enabled',
  },
  'auth.external.x.client_id': {
    settingHref: toAuthProvidersHref('x+/+twitter+(oauth+2.0)'),
    label: 'X client ID',
  },
  'auth.external.x.email_optional': {
    settingHref: toAuthProvidersHref('x+/+twitter+(oauth+2.0)'),
    label: 'X email optional',
  },
  'auth.external.x.skip_nonce_check': {
    settingHref: toAuthProvidersHref('x+/+twitter+(oauth+2.0)'),
    label: 'X skip nonce check',
  },
  'auth.external.workos.client_id': {
    settingHref: toAuthProvidersHref('workos'),
    label: 'WorkOS client ID',
  },
  'auth.external.workos.email_optional': {
    settingHref: toAuthProvidersHref('workos'),
    label: 'WorkOS email optional',
  },
  'auth.external.workos.enabled': {
    settingHref: toAuthProvidersHref('workos'),
    label: 'WorkOS enabled',
  },
  'auth.external.workos.skip_nonce_check': {
    settingHref: toAuthProvidersHref('workos'),
    label: 'WorkOS skip nonce check',
  },
  'auth.external.workos.url': { settingHref: toAuthProvidersHref('workos'), label: 'WorkOS URL' },
  'auth.external.zoom.client_id': {
    settingHref: toAuthProvidersHref('zoom'),
    label: 'Zoom client ID',
  },
  'auth.external.zoom.email_optional': {
    settingHref: toAuthProvidersHref('zoom'),
    label: 'Zoom email optional',
  },
  'auth.external.zoom.enabled': { settingHref: toAuthProvidersHref('zoom'), label: 'Zoom enabled' },
  'auth.external.zoom.skip_nonce_check': {
    settingHref: toAuthProvidersHref('zoom'),
    label: 'Zoom skip nonce check',
  },
  'auth.hook.before_user_created.enabled': {
    settingHref: toProjectHref,
    label: 'Before user created hook enabled',
  },
  'auth.hook.custom_access_token.enabled': {
    settingHref: toProjectHref,
    label: 'Custom access token hook enabled',
  },
  'auth.hook.mfa_verification_attempt.enabled': {
    settingHref: toProjectHref,
    label: 'MFA verification attempt hook enabled',
  },
  'auth.hook.password_verification_attempt.enabled': {
    settingHref: toProjectHref,
    label: 'Password verification attempt hook enabled',
  },
  'auth.hook.send_email.enabled': { settingHref: toProjectHref, label: 'Send email hook enabled' },
  'auth.hook.send_sms.enabled': { settingHref: toProjectHref, label: 'Send SMS hook enabled' },
  'auth.jwt_expiry': { settingHref: toProjectHref, label: 'JWT expiry' },
  'auth.mfa.max_enrolled_factors': {
    settingHref: toProjectHref,
    label: 'Max enrolled MFA factors',
  },
  'auth.mfa.phone.enroll_enabled': { settingHref: toProjectHref, label: 'Phone MFA enrollment' },
  'auth.mfa.phone.max_frequency': {
    settingHref: toProjectHref,
    label: 'Phone MFA send frequency limit',
  },
  'auth.mfa.phone.otp_length': { settingHref: toProjectHref, label: 'Phone MFA OTP length' },
  'auth.mfa.phone.template': { settingHref: toProjectHref, label: 'Phone MFA template' },
  'auth.mfa.phone.verify_enabled': { settingHref: toProjectHref, label: 'Phone MFA verification' },
  'auth.mfa.totp.enroll_enabled': { settingHref: toProjectHref, label: 'TOTP enrollment' },
  'auth.mfa.totp.verify_enabled': { settingHref: toProjectHref, label: 'TOTP verification' },
  'auth.mfa.web_authn.enroll_enabled': {
    settingHref: toProjectHref,
    label: 'WebAuthn MFA enrollment',
  },
  'auth.mfa.web_authn.verify_enabled': {
    settingHref: toProjectHref,
    label: 'WebAuthn MFA verification',
  },
  'auth.minimum_password_length': {
    settingHref: toAuthProvidersHref(),
    label: 'Minimum password length',
  },
  'auth.oauth_server.allow_dynamic_registration': {
    settingHref: toProjectHref,
    label: 'Allow dynamic client registration',
  },
  'auth.oauth_server.authorization_url_path': {
    settingHref: toProjectHref,
    label: 'OAuth authorization URL path',
  },
  'auth.oauth_server.enabled': { settingHref: toProjectHref, label: 'OAuth server enabled' },
  'auth.password_requirements': {
    settingHref: toAuthProvidersHref(),
    label: 'Password requirements',
  },
  'auth.rate_limit.anonymous_users': {
    settingHref: toProjectHref,
    label: 'Anonymous sign-in rate limit',
  },
  'auth.rate_limit.email_sent': { settingHref: toProjectHref, label: 'Email rate limit' },
  'auth.rate_limit.sign_in_sign_ups': {
    settingHref: toProjectHref,
    label: 'Sign-in/sign-up rate limit',
  },
  'auth.rate_limit.sms_sent': { settingHref: toProjectHref, label: 'SMS rate limit' },
  'auth.rate_limit.token_refresh': {
    settingHref: toProjectHref,
    label: 'Token refresh rate limit',
  },
  'auth.rate_limit.token_verifications': {
    settingHref: toProjectHref,
    label: 'Token verification rate limit',
  },
  'auth.rate_limit.web3': { settingHref: toProjectHref, label: 'Web3 rate limit' },
  'auth.refresh_token_reuse_interval': {
    settingHref: toProjectHref,
    label: 'Refresh token reuse interval',
  },
  'auth.sessions.inactivity_timeout': {
    settingHref: toProjectHref,
    label: 'Session inactivity timeout',
  },
  'auth.sessions.timebox': { settingHref: toProjectHref, label: 'Session timebox' },
  'auth.site_url': { settingHref: toAuthUrlConfigHref, label: 'Site URL' },
  'auth.sms.enable_confirmations': {
    settingHref: toAuthProvidersHref(),
    label: 'SMS confirmations',
  },
  'auth.sms.enable_signup': { settingHref: toAuthProvidersHref(), label: 'Phone signups' },
  'auth.sms.max_frequency': { settingHref: toProjectHref, label: 'SMS send frequency limit' },
  'auth.sms.messagebird.enabled': { settingHref: toProjectHref, label: 'MessageBird enabled' },
  'auth.sms.messagebird.originator': {
    settingHref: toAuthProvidersHref(),
    label: 'MessageBird originator',
  },
  'auth.sms.otp_expiry': { settingHref: toAuthProvidersHref(), label: 'SMS OTP expiry' },
  'auth.sms.otp_length': { settingHref: toAuthProvidersHref(), label: 'SMS OTP length' },
  'auth.sms.provider': { settingHref: toAuthProvidersHref(), label: 'SMS provider' },
  'auth.sms.template': { settingHref: toAuthProvidersHref(), label: 'SMS template' },
  'auth.sms.textlocal.enabled': { settingHref: toProjectHref, label: 'Textlocal enabled' },
  'auth.sms.textlocal.sender': { settingHref: toAuthProvidersHref(), label: 'Textlocal sender' },
  'auth.sms.twilio.account_sid': {
    settingHref: toAuthProvidersHref(),
    label: 'Twilio account SID',
  },
  'auth.sms.twilio.content_sid': {
    settingHref: toAuthProvidersHref(),
    label: 'Twilio content SID',
  },
  'auth.sms.twilio.enabled': { settingHref: toAuthProvidersHref(), label: 'Twilio enabled' },
  'auth.sms.twilio.message_service_sid': {
    settingHref: toAuthProvidersHref(),
    label: 'Twilio message service SID',
  },
  'auth.sms.twilio_verify.account_sid': {
    settingHref: toAuthProvidersHref(),
    label: 'Twilio Verify account SID',
  },
  'auth.sms.twilio_verify.enabled': { settingHref: toProjectHref, label: 'Twilio Verify enabled' },
  'auth.sms.twilio_verify.message_service_sid': {
    settingHref: toAuthProvidersHref(),
    label: 'Twilio Verify message service SID',
  },
  'auth.sms.vonage.enabled': { settingHref: toProjectHref, label: 'Vonage enabled' },
  'auth.sms.vonage.from': { settingHref: toAuthProvidersHref(), label: 'Vonage from' },
  'auth.third_party.auth0.enabled': { settingHref: toProjectHref, label: 'Auth0 enabled' },
  'auth.third_party.aws_cognito.enabled': {
    settingHref: toProjectHref,
    label: 'AWS Cognito enabled',
  },
  'auth.third_party.clerk.enabled': { settingHref: toProjectHref, label: 'Clerk enabled' },
  'auth.third_party.firebase.enabled': { settingHref: toProjectHref, label: 'Firebase enabled' },
  'auth.third_party.workos.enabled': { settingHref: toProjectHref, label: 'WorkOS enabled' },
  'auth.web3.ethereum.enabled': { settingHref: toProjectHref, label: 'Ethereum Web3 enabled' },
  'auth.web3.solana.enabled': { settingHref: toProjectHref, label: 'Solana Web3 enabled' },
  'db.health_timeout': { settingHref: toProjectHref, label: 'Health check timeout' },
  'db.major_version': { settingHref: toProjectHref, label: 'Postgres major version' },
  'db.migrations.enabled': { settingHref: toProjectHref, label: 'Migrations enabled' },
  'db.migrations.schema_paths': { settingHref: toProjectHref, label: 'Migration schema paths' },
  'db.network_restrictions.allowed_cidrs': {
    settingHref: toProjectHref,
    label: 'Allowed CIDRs (IPv4)',
  },
  'db.network_restrictions.allowed_cidrs_v6': {
    settingHref: toProjectHref,
    label: 'Allowed CIDRs (IPv6)',
  },
  'db.network_restrictions.enabled': {
    settingHref: toProjectHref,
    label: 'Network restrictions enabled',
  },
  'db.pooler.default_pool_size': { settingHref: toProjectHref, label: 'Default pool size' },
  'db.pooler.enabled': { settingHref: toProjectHref, label: 'Connection pooler enabled' },
  'db.pooler.max_client_conn': { settingHref: toProjectHref, label: 'Max client connections' },
  'db.pooler.pool_mode': { settingHref: toProjectHref, label: 'Pool mode' },
  'db.pooler.port': { settingHref: toProjectHref, label: 'Pooler port' },
  'db.port': { settingHref: toProjectHref, label: 'Database port' },
  'db.seed.enabled': { settingHref: toProjectHref, label: 'Seed enabled' },
  'db.seed.sql_paths': { settingHref: toProjectHref, label: 'Seed file paths' },
  'db.shadow_port': { settingHref: toProjectHref, label: 'Shadow database port' },
  'db.ssl_enforcement.enabled': { settingHref: toProjectHref, label: 'SSL enforcement enabled' },
  'edge_runtime.deno_version': { settingHref: toProjectHref, label: 'Deno version' },
  'edge_runtime.enabled': { settingHref: toProjectHref, label: 'Edge runtime enabled' },
  'edge_runtime.inspector_port': {
    settingHref: toProjectHref,
    label: 'Edge runtime inspector port',
  },
  'edge_runtime.policy': { settingHref: toProjectHref, label: 'Edge runtime policy' },
  'experimental.inspect.rules': { settingHref: toProjectHref, label: 'Inspect rules' },
  'experimental.orioledb_version': { settingHref: toProjectHref, label: 'OrioleDB version' },
  'experimental.pgdelta.enabled': { settingHref: toProjectHref, label: 'pgdelta enabled' },
  'experimental.s3_access_key': { settingHref: toProjectHref, label: 'S3 access key' },
  'experimental.s3_host': { settingHref: toProjectHref, label: 'S3 host' },
  'experimental.s3_region': { settingHref: toProjectHref, label: 'S3 region' },
  'experimental.s3_secret_key': { settingHref: toProjectHref, label: 'S3 secret key' },
  'experimental.webhooks.enabled': { settingHref: toProjectHref, label: 'Webhooks enabled' },
  'inbucket.enabled': { settingHref: toProjectHref, label: 'Inbucket enabled' },
  'inbucket.port': { settingHref: toProjectHref, label: 'Inbucket port' },
  'realtime.enabled': { settingHref: toProjectHref, label: 'Realtime enabled' },
  'realtime.ip_version': { settingHref: toProjectHref, label: 'IP version' },
  'realtime.max_header_length': { settingHref: toProjectHref, label: 'Max header length' },
  'storage.analytics.enabled': { settingHref: toProjectHref, label: 'Storage analytics enabled' },
  'storage.analytics.max_catalogs': { settingHref: toProjectHref, label: 'Max analytics catalogs' },
  'storage.analytics.max_namespaces': {
    settingHref: toProjectHref,
    label: 'Max analytics namespaces',
  },
  'storage.analytics.max_tables': { settingHref: toProjectHref, label: 'Max analytics tables' },
  'storage.enabled': { settingHref: toProjectHref, label: 'Storage enabled' },
  // Both sides now report this as a canonical string (e.g. "50MiB") via @supabase/config's
  // `fromApiProjectConfig`/`fromConfigDocument`, so no normalization is needed here anymore.
  'storage.file_size_limit': { settingHref: toStorageSettingsHref, label: 'File size limit' },
  'storage.image_transformation.enabled': {
    settingHref: toProjectHref,
    label: 'Image transformation enabled',
  },
  'storage.s3_protocol.enabled': { settingHref: toProjectHref, label: 'S3 protocol enabled' },
  'storage.vector.enabled': { settingHref: toProjectHref, label: 'Storage vector enabled' },
  'storage.vector.max_buckets': { settingHref: toProjectHref, label: 'Max vector buckets' },
  'storage.vector.max_indexes': { settingHref: toProjectHref, label: 'Max vector indexes' },
  'studio.api_url': { settingHref: toProjectHref, label: 'Studio API URL' },
  'studio.enabled': { settingHref: toProjectHref, label: 'Studio enabled' },
  'studio.port': { settingHref: toProjectHref, label: 'Studio port' },
}

export function getFieldDefinition(configPath: string): ResolvedConfigFieldDefinition | undefined {
  const definition = CONFIG_FIELD_REGISTRY[configPath]
  if (!definition) return undefined
  return { ...definition, configPath }
}

/**
 * A config section can nest fields arbitrarily deep (e.g. `storage.analytics.max_namespaces`),
 * mirroring how deep `gitHubConfigTomlSchema` itself nests. Recurse through plain objects — but not
 * arrays, which are leaf values — to produce one section-prefixed dotted path per leaf, matching how
 * `CONFIG_FIELD_REGISTRY` is keyed.
 */
export function getSectionFieldEntries(
  section: ConfigSection,
  sectionConfig: Record<string, unknown>
): Array<{ configPath: string; rawValue: unknown }> {
  const entries: Array<{ configPath: string; rawValue: unknown }> = []

  function walk(value: unknown, path: string[]) {
    if (isRecord(value)) {
      for (const [key, nestedValue] of Object.entries(value)) walk(nestedValue, [...path, key])
      return
    }

    entries.push({ configPath: path.join('.'), rawValue: value })
  }

  for (const [key, value] of Object.entries(sectionConfig)) {
    walk(value, [section, key])
  }

  return entries
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value)
}

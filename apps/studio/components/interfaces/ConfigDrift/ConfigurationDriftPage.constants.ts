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
  `/project/${projectRef}/auth/providers${provider ? `?provider=${provider}` : ''}`
const toAuthProtectionHref = (projectRef: string) => `/project/${projectRef}/auth/protection`
const toDatabaseSettingsHref = (projectRef: string) => `/project/${projectRef}/database/settings`
const toDataApiSettingsHref = (projectRef: string) =>
  `/project/${projectRef}/integrations/data_api/settings`
const toStorageSettingsHref = (projectRef: string) =>
  `/project/${projectRef}/storage/files/settings`
const toProjectHref = (projectRef: string) => `/project/${projectRef}`
const toAuthTemplatesHref = (projectRef: string) => `/project/${projectRef}/auth/templates`
const toAuthHooksHref = (projectRef: string) => `/project/${projectRef}/auth/hooks`
const toAuthSmtpHref = (projectRef: string) => `/project/${projectRef}/auth/smtp`
const toAuthThirdPartyHref = (projectRef: string) => `/project/${projectRef}/auth/third-party`
const toJwtKeysHref = (projectRef: string) => `/project/${projectRef}/settings/jwt`
const toComputeHref = (projectRef: string) => `/project/${projectRef}/compute`
const toStorageBucketsHref = (projectRef: string) => `/project/${projectRef}/storage/files`
const toStorageAnalyticsBucketsHref = (projectRef: string) =>
  `/project/${projectRef}/storage/analytics`
const toStorageVectorBucketsHref = (projectRef: string) => `/project/${projectRef}/storage/vectors`

/**
 * Every trackable field across every section, keyed by its config.toml dotted path — the same shape
 * `getFieldDefinition`/`getSectionFieldEntries` address.
 */
// Entries with no dedicated Studio settings page fall back to `toProjectHref`.
export const CONFIG_FIELD_REGISTRY: Record<string, ConfigFieldDefinition> = {
  'api.auto_expose_new_tables': {
    settingHref: toDataApiSettingsHref,
    label: 'Auto-expose new tables',
  },
  'api.enabled': { settingHref: toDataApiSettingsHref, label: 'API enabled' },
  'api.extra_search_path': { settingHref: toDataApiSettingsHref, label: 'Extra search path' },
  'api.max_rows': { settingHref: toDataApiSettingsHref, label: 'Max rows' },
  'api.schemas': { settingHref: toDataApiSettingsHref, label: 'Exposed schemas' },
  'auth.additional_redirect_urls': { settingHref: toAuthUrlConfigHref, label: 'Redirect URLs' },
  'auth.captcha.enabled': { settingHref: toAuthProtectionHref, label: 'Captcha enabled' },
  'auth.captcha.provider': { settingHref: toAuthProtectionHref, label: 'Captcha provider' },
  'auth.email.double_confirm_changes': {
    settingHref: toAuthProvidersHref('email'),
    label: 'Secure email change',
  },
  'auth.email.enable_confirmations': {
    settingHref: toAuthProvidersHref(),
    label: 'Email confirmations',
  },
  'auth.email.enable_signup': { settingHref: toAuthProvidersHref(), label: 'Email signups' },
  'auth.email.max_frequency': {
    settingHref: toAuthTemplatesHref,
    label: 'Email send frequency limit',
  },
  'auth.email.notification': { settingHref: toAuthTemplatesHref, label: 'Email notifications' },
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
  'auth.email.otp_length': { settingHref: toAuthProvidersHref('email'), label: 'Email OTP length' },
  'auth.email.secure_password_change': {
    settingHref: toAuthProvidersHref('email'),
    label: 'Secure password change',
  },
  'auth.email.smtp.admin_email': { settingHref: toAuthSmtpHref, label: 'SMTP admin email' },
  'auth.email.smtp.enabled': { settingHref: toProjectHref, label: 'Custom SMTP enabled' },
  'auth.email.smtp.host': { settingHref: toAuthSmtpHref, label: 'SMTP host' },
  'auth.email.smtp.port': { settingHref: toAuthSmtpHref, label: 'SMTP port' },
  'auth.email.smtp.sender_name': { settingHref: toAuthSmtpHref, label: 'SMTP sender name' },
  'auth.email.smtp.user': { settingHref: toAuthSmtpHref, label: 'SMTP user' },
  'auth.email.template': { settingHref: toAuthTemplatesHref, label: 'Email templates' },
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
  'auth.external.apple.redirect_uri': {
    settingHref: toAuthProvidersHref('apple'),
    label: 'Apple redirect URI',
  },
  'auth.external.apple.skip_nonce_check': {
    settingHref: toAuthProvidersHref('apple'),
    label: 'Apple skip nonce check',
  },
  'auth.external.apple.url': { settingHref: toAuthProvidersHref('apple'), label: 'Apple URL' },
  'auth.external.azure.client_id': {
    settingHref: toAuthProvidersHref('azure'),
    label: 'Azure client ID',
  },
  'auth.external.azure.email_optional': {
    settingHref: toAuthProvidersHref('azure'),
    label: 'Azure email optional',
  },
  'auth.external.azure.enabled': {
    settingHref: toAuthProvidersHref('azure'),
    label: 'Azure enabled',
  },
  'auth.external.azure.redirect_uri': {
    settingHref: toAuthProvidersHref('azure'),
    label: 'Azure redirect URI',
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
  'auth.external.bitbucket.redirect_uri': {
    settingHref: toAuthProvidersHref('bitbucket'),
    label: 'Bitbucket redirect URI',
  },
  'auth.external.bitbucket.skip_nonce_check': {
    settingHref: toAuthProvidersHref('bitbucket'),
    label: 'Bitbucket skip nonce check',
  },
  'auth.external.bitbucket.url': {
    settingHref: toAuthProvidersHref('bitbucket'),
    label: 'Bitbucket URL',
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
  'auth.external.discord.redirect_uri': {
    settingHref: toAuthProvidersHref('discord'),
    label: 'Discord redirect URI',
  },
  'auth.external.discord.skip_nonce_check': {
    settingHref: toAuthProvidersHref('discord'),
    label: 'Discord skip nonce check',
  },
  'auth.external.discord.url': {
    settingHref: toAuthProvidersHref('discord'),
    label: 'Discord URL',
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
  'auth.external.facebook.redirect_uri': {
    settingHref: toAuthProvidersHref('facebook'),
    label: 'Facebook redirect URI',
  },
  'auth.external.facebook.skip_nonce_check': {
    settingHref: toAuthProvidersHref('facebook'),
    label: 'Facebook skip nonce check',
  },
  'auth.external.facebook.url': {
    settingHref: toAuthProvidersHref('facebook'),
    label: 'Facebook URL',
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
  'auth.external.figma.redirect_uri': {
    settingHref: toAuthProvidersHref('figma'),
    label: 'Figma redirect URI',
  },
  'auth.external.figma.skip_nonce_check': {
    settingHref: toAuthProvidersHref('figma'),
    label: 'Figma skip nonce check',
  },
  'auth.external.figma.url': { settingHref: toAuthProvidersHref('figma'), label: 'Figma URL' },
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
  'auth.external.github.redirect_uri': {
    settingHref: toAuthProvidersHref('github'),
    label: 'GitHub redirect URI',
  },
  'auth.external.github.skip_nonce_check': {
    settingHref: toAuthProvidersHref('github'),
    label: 'GitHub skip nonce check',
  },
  'auth.external.github.url': { settingHref: toAuthProvidersHref('github'), label: 'GitHub URL' },
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
  'auth.external.gitlab.redirect_uri': {
    settingHref: toAuthProvidersHref('gitlab'),
    label: 'GitLab redirect URI',
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
  'auth.external.google.redirect_uri': {
    settingHref: toAuthProvidersHref('google'),
    label: 'Google redirect URI',
  },
  'auth.external.google.skip_nonce_check': {
    settingHref: toAuthProvidersHref('google'),
    label: 'Google skip nonce check',
  },
  'auth.external.google.url': { settingHref: toAuthProvidersHref('google'), label: 'Google URL' },
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
  'auth.external.kakao.redirect_uri': {
    settingHref: toAuthProvidersHref('kakao'),
    label: 'Kakao redirect URI',
  },
  'auth.external.kakao.skip_nonce_check': {
    settingHref: toAuthProvidersHref('kakao'),
    label: 'Kakao skip nonce check',
  },
  'auth.external.kakao.url': { settingHref: toAuthProvidersHref('kakao'), label: 'Kakao URL' },
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
  'auth.external.keycloak.redirect_uri': {
    settingHref: toAuthProvidersHref('keycloak'),
    label: 'Keycloak redirect URI',
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
  'auth.external.linkedin_oidc.redirect_uri': {
    settingHref: toAuthProvidersHref('LinkedIn+(OIDC)'),
    label: 'LinkedIn (OIDC) redirect URI',
  },
  'auth.external.linkedin_oidc.skip_nonce_check': {
    settingHref: toAuthProvidersHref('LinkedIn+(OIDC)'),
    label: 'LinkedIn (OIDC) skip nonce check',
  },
  'auth.external.linkedin_oidc.url': {
    settingHref: toAuthProvidersHref('LinkedIn+(OIDC)'),
    label: 'LinkedIn (OIDC) URL',
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
  'auth.external.notion.redirect_uri': {
    settingHref: toAuthProvidersHref('notion'),
    label: 'Notion redirect URI',
  },
  'auth.external.notion.skip_nonce_check': {
    settingHref: toAuthProvidersHref('notion'),
    label: 'Notion skip nonce check',
  },
  'auth.external.notion.url': { settingHref: toAuthProvidersHref('notion'), label: 'Notion URL' },
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
  'auth.external.slack_oidc.redirect_uri': {
    settingHref: toAuthProvidersHref('slack+(OIDC)'),
    label: 'Slack (OIDC) redirect URI',
  },
  'auth.external.slack_oidc.skip_nonce_check': {
    settingHref: toAuthProvidersHref('slack+(OIDC)'),
    label: 'Slack (OIDC) skip nonce check',
  },
  'auth.external.slack_oidc.url': {
    settingHref: toAuthProvidersHref('slack+(OIDC)'),
    label: 'Slack (OIDC) URL',
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
  'auth.external.spotify.redirect_uri': {
    settingHref: toAuthProvidersHref('spotify'),
    label: 'Spotify redirect URI',
  },
  'auth.external.spotify.skip_nonce_check': {
    settingHref: toAuthProvidersHref('spotify'),
    label: 'Spotify skip nonce check',
  },
  'auth.external.spotify.url': {
    settingHref: toAuthProvidersHref('spotify'),
    label: 'Spotify URL',
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
  'auth.external.twitch.redirect_uri': {
    settingHref: toAuthProvidersHref('twitch'),
    label: 'Twitch redirect URI',
  },
  'auth.external.twitch.skip_nonce_check': {
    settingHref: toAuthProvidersHref('twitch'),
    label: 'Twitch skip nonce check',
  },
  'auth.external.twitch.url': { settingHref: toAuthProvidersHref('twitch'), label: 'Twitch URL' },
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
  'auth.external.twitter.redirect_uri': {
    settingHref: toAuthProvidersHref('twitter+(deprecated)'),
    label: 'Twitter redirect URI',
  },
  'auth.external.twitter.skip_nonce_check': {
    settingHref: toAuthProvidersHref('twitter+(deprecated)'),
    label: 'Twitter skip nonce check',
  },
  'auth.external.twitter.url': {
    settingHref: toAuthProvidersHref('twitter+(deprecated)'),
    label: 'Twitter URL',
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
  'auth.external.x.redirect_uri': {
    settingHref: toAuthProvidersHref('x+/+twitter+(oauth+2.0)'),
    label: 'X redirect URI',
  },
  'auth.external.x.url': {
    settingHref: toAuthProvidersHref('x+/+twitter+(oauth+2.0)'),
    label: 'X URL',
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
  'auth.external.workos.redirect_uri': {
    settingHref: toAuthProvidersHref('workos'),
    label: 'WorkOS redirect URI',
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
  'auth.external.zoom.redirect_uri': {
    settingHref: toAuthProvidersHref('zoom'),
    label: 'Zoom redirect URI',
  },
  'auth.external.zoom.skip_nonce_check': {
    settingHref: toAuthProvidersHref('zoom'),
    label: 'Zoom skip nonce check',
  },
  'auth.external.zoom.url': { settingHref: toAuthProvidersHref('zoom'), label: 'Zoom URL' },
  'auth.hook.before_user_created.enabled': {
    settingHref: toProjectHref,
    label: 'Before user created hook enabled',
  },
  'auth.hook.before_user_created.uri': {
    settingHref: toAuthHooksHref,
    label: 'Before user created hook URI',
  },
  'auth.hook.custom_access_token.enabled': {
    settingHref: toProjectHref,
    label: 'Custom access token hook enabled',
  },
  'auth.hook.custom_access_token.uri': {
    settingHref: toAuthHooksHref,
    label: 'Custom access token hook URI',
  },
  'auth.hook.mfa_verification_attempt.enabled': {
    settingHref: toProjectHref,
    label: 'MFA verification attempt hook enabled',
  },
  'auth.hook.mfa_verification_attempt.uri': {
    settingHref: toAuthHooksHref,
    label: 'MFA verification attempt hook URI',
  },
  'auth.hook.password_verification_attempt.enabled': {
    settingHref: toProjectHref,
    label: 'Password verification attempt hook enabled',
  },
  'auth.hook.password_verification_attempt.uri': {
    settingHref: toAuthHooksHref,
    label: 'Password verification attempt hook URI',
  },
  'auth.hook.send_email.enabled': { settingHref: toProjectHref, label: 'Send email hook enabled' },
  'auth.hook.send_email.uri': { settingHref: toAuthHooksHref, label: 'Send email hook URI' },
  'auth.hook.send_sms.enabled': { settingHref: toProjectHref, label: 'Send SMS hook enabled' },
  'auth.hook.send_sms.uri': { settingHref: toAuthHooksHref, label: 'Send SMS hook URI' },
  'auth.jwt_expiry': { settingHref: toProjectHref, label: 'JWT expiry' },
  'auth.jwt_issuer': { settingHref: toJwtKeysHref, label: 'JWT issuer' },
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
  'auth.signing_keys_path': { settingHref: toJwtKeysHref, label: 'Signing keys path' },
  'auth.site_url': { settingHref: toAuthUrlConfigHref, label: 'Site URL' },
  'auth.sms.enable_confirmations': {
    settingHref: toAuthProvidersHref('phone'),
    label: 'SMS confirmations',
  },
  'auth.sms.enable_signup': { settingHref: toAuthProvidersHref('phone'), label: 'Phone signups' },
  'auth.sms.max_frequency': {
    settingHref: toAuthProvidersHref('phone'),
    label: 'SMS send frequency limit',
  },
  'auth.sms.messagebird.enabled': {
    settingHref: toAuthProvidersHref('phone'),
    label: 'MessageBird enabled',
  },
  'auth.sms.messagebird.originator': {
    settingHref: toAuthProvidersHref('phone'),
    label: 'MessageBird originator',
  },
  'auth.sms.otp_expiry': { settingHref: toAuthProvidersHref('phone'), label: 'SMS OTP expiry' },
  'auth.sms.otp_length': { settingHref: toAuthProvidersHref('phone'), label: 'SMS OTP length' },
  'auth.sms.provider': { settingHref: toAuthProvidersHref('phone'), label: 'SMS provider' },
  'auth.sms.template': { settingHref: toAuthProvidersHref('phone'), label: 'SMS template' },
  'auth.sms.test_otp': { settingHref: toAuthProvidersHref('phone'), label: 'Test OTP' },
  'auth.sms.textlocal.enabled': {
    settingHref: toAuthProvidersHref('phone'),
    label: 'Textlocal enabled',
  },
  'auth.sms.textlocal.sender': {
    settingHref: toAuthProvidersHref('phone'),
    label: 'Textlocal sender',
  },
  'auth.sms.twilio.account_sid': {
    settingHref: toAuthProvidersHref('phone'),
    label: 'Twilio account SID',
  },
  'auth.sms.twilio.content_sid': {
    settingHref: toAuthProvidersHref('phone'),
    label: 'Twilio content SID',
  },
  'auth.sms.twilio.enabled': { settingHref: toAuthProvidersHref('phone'), label: 'Twilio enabled' },
  'auth.sms.twilio.message_service_sid': {
    settingHref: toAuthProvidersHref('phone'),
    label: 'Twilio message service SID',
  },
  'auth.sms.twilio_verify.account_sid': {
    settingHref: toAuthProvidersHref('phone'),
    label: 'Twilio Verify account SID',
  },
  'auth.sms.twilio_verify.enabled': {
    settingHref: toAuthProvidersHref('phone'),
    label: 'Twilio Verify enabled',
  },
  'auth.sms.twilio_verify.message_service_sid': {
    settingHref: toAuthProvidersHref('phone'),
    label: 'Twilio Verify message service SID',
  },
  'auth.sms.vonage.api_key': { settingHref: toAuthProvidersHref('phone'), label: 'Vonage API key' },
  'auth.sms.vonage.enabled': { settingHref: toAuthProvidersHref('phone'), label: 'Vonage enabled' },
  'auth.sms.vonage.from': { settingHref: toAuthProvidersHref('phone'), label: 'Vonage from' },
  'auth.third_party.auth0.enabled': { settingHref: toProjectHref, label: 'Auth0 enabled' },
  'auth.third_party.auth0.tenant': { settingHref: toAuthThirdPartyHref, label: 'Auth0 tenant' },
  'auth.third_party.auth0.tenant_region': {
    settingHref: toAuthThirdPartyHref,
    label: 'Auth0 tenant region',
  },
  'auth.third_party.aws_cognito.enabled': {
    settingHref: toProjectHref,
    label: 'AWS Cognito enabled',
  },
  'auth.third_party.aws_cognito.user_pool_id': {
    settingHref: toAuthThirdPartyHref,
    label: 'AWS Cognito user pool ID',
  },
  'auth.third_party.aws_cognito.user_pool_region': {
    settingHref: toAuthThirdPartyHref,
    label: 'AWS Cognito user pool region',
  },
  'auth.third_party.clerk.domain': { settingHref: toAuthThirdPartyHref, label: 'Clerk domain' },
  'auth.third_party.clerk.enabled': { settingHref: toProjectHref, label: 'Clerk enabled' },
  'auth.third_party.firebase.enabled': { settingHref: toProjectHref, label: 'Firebase enabled' },
  'auth.third_party.firebase.project_id': {
    settingHref: toAuthThirdPartyHref,
    label: 'Firebase project ID',
  },
  'auth.third_party.workos.enabled': { settingHref: toProjectHref, label: 'WorkOS enabled' },
  'auth.third_party.workos.issuer_url': {
    settingHref: toAuthThirdPartyHref,
    label: 'WorkOS issuer URL',
  },
  'auth.web3.ethereum.enabled': { settingHref: toProjectHref, label: 'Ethereum Web3 enabled' },
  'auth.web3.solana.enabled': { settingHref: toProjectHref, label: 'Solana Web3 enabled' },
  compute: { settingHref: toComputeHref, label: 'Compute services' },
  'db.health_timeout': { settingHref: toProjectHref, label: 'Health check timeout' },
  'db.major_version': { settingHref: toProjectHref, label: 'Postgres major version' },
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
  'db.pooler.default_pool_size': {
    settingHref: toDatabaseSettingsHref,
    label: 'Default pool size',
  },
  'db.pooler.max_client_conn': {
    settingHref: toDatabaseSettingsHref,
    label: 'Max client connections',
  },
  'db.pooler.pool_mode': { settingHref: toProjectHref, label: 'Pool mode' },
  'db.settings.effective_cache_size': {
    settingHref: toProjectHref,
    label: 'Effective cache size',
  },
  'db.settings.logical_decoding_work_mem': {
    settingHref: toProjectHref,
    label: 'Logical decoding work mem',
  },
  'db.settings.maintenance_work_mem': {
    settingHref: toProjectHref,
    label: 'Maintenance work mem',
  },
  'db.settings.max_connections': { settingHref: toProjectHref, label: 'Max connections' },
  'db.settings.max_locks_per_transaction': {
    settingHref: toProjectHref,
    label: 'Max locks per transaction',
  },
  'db.settings.max_parallel_maintenance_workers': {
    settingHref: toProjectHref,
    label: 'Max parallel maintenance workers',
  },
  'db.settings.max_parallel_workers': {
    settingHref: toProjectHref,
    label: 'Max parallel workers',
  },
  'db.settings.max_parallel_workers_per_gather': {
    settingHref: toProjectHref,
    label: 'Max parallel workers per gather',
  },
  'db.settings.max_replication_slots': {
    settingHref: toProjectHref,
    label: 'Max replication slots',
  },
  'db.settings.max_slot_wal_keep_size': {
    settingHref: toProjectHref,
    label: 'Max slot WAL keep size',
  },
  'db.settings.max_standby_archive_delay': {
    settingHref: toProjectHref,
    label: 'Max standby archive delay',
  },
  'db.settings.max_standby_streaming_delay': {
    settingHref: toProjectHref,
    label: 'Max standby streaming delay',
  },
  'db.settings.max_wal_senders': { settingHref: toProjectHref, label: 'Max WAL senders' },
  'db.settings.max_wal_size': { settingHref: toProjectHref, label: 'Max WAL size' },
  'db.settings.max_worker_processes': {
    settingHref: toProjectHref,
    label: 'Max worker processes',
  },
  'db.settings.session_replication_role': {
    settingHref: toProjectHref,
    label: 'Session replication role',
  },
  'db.settings.shared_buffers': { settingHref: toProjectHref, label: 'Shared buffers' },
  'db.settings.statement_timeout': { settingHref: toProjectHref, label: 'Statement timeout' },
  'db.settings.track_activity_query_size': {
    settingHref: toProjectHref,
    label: 'Track activity query size',
  },
  'db.settings.track_commit_timestamp': {
    settingHref: toProjectHref,
    label: 'Track commit timestamp',
  },
  'db.settings.wal_keep_size': { settingHref: toProjectHref, label: 'WAL keep size' },
  'db.settings.wal_sender_timeout': { settingHref: toProjectHref, label: 'WAL sender timeout' },
  'db.settings.work_mem': { settingHref: toProjectHref, label: 'Work mem' },
  'db.ssl_enforcement.enabled': {
    settingHref: toDatabaseSettingsHref,
    label: 'SSL enforcement enabled',
  },
  'experimental.webhooks.enabled': { settingHref: toProjectHref, label: 'Webhooks enabled' },
  'storage.analytics.buckets': {
    settingHref: toStorageAnalyticsBucketsHref,
    label: 'Analytics buckets',
  },
  'storage.analytics.enabled': { settingHref: toProjectHref, label: 'Storage analytics enabled' },
  'storage.analytics.max_catalogs': { settingHref: toProjectHref, label: 'Max analytics catalogs' },
  'storage.analytics.max_namespaces': {
    settingHref: toProjectHref,
    label: 'Max analytics namespaces',
  },
  'storage.analytics.max_tables': { settingHref: toProjectHref, label: 'Max analytics tables' },
  'storage.buckets': { settingHref: toStorageBucketsHref, label: 'Storage buckets' },
  'storage.enabled': { settingHref: toProjectHref, label: 'Storage enabled' },
  // Both sides now report this as a canonical string (e.g. "50MiB") via @supabase/config's
  // `fromApiProjectConfig`/`fromConfigDocument`, so no normalization is needed here anymore.
  'storage.file_size_limit': { settingHref: toStorageSettingsHref, label: 'File size limit' },
  'storage.image_transformation.enabled': {
    settingHref: toProjectHref,
    label: 'Image transformation enabled',
  },
  'storage.s3_protocol.enabled': { settingHref: toProjectHref, label: 'S3 protocol enabled' },
  'storage.vector.buckets': { settingHref: toStorageVectorBucketsHref, label: 'Vector buckets' },
  'storage.vector.enabled': { settingHref: toProjectHref, label: 'Storage vector enabled' },
  'storage.vector.max_buckets': { settingHref: toProjectHref, label: 'Max vector buckets' },
  'storage.vector.max_indexes': { settingHref: toProjectHref, label: 'Max vector indexes' },
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

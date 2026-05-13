import { SHORTCUT_REFERENCE_GROUPS } from '../referenceGroups'
import { RegistryDefinations } from '../types'

/**
 * Contextual chords for jumping between Authentication sub-pages — `A + <letter>`.
 *
 * Active only while AuthLayout is mounted (i.e. the user is somewhere under
 * `/project/<ref>/auth/*`). Mirrors the database-nav pattern: the leading `A`
 * is layout-scoped so it doesn't burn a global key.
 */
export const AUTH_NAV_SHORTCUT_IDS = {
  NAV_AUTH_OVERVIEW: 'nav.auth-overview',
  NAV_AUTH_USERS: 'nav.auth-users',
  NAV_AUTH_OAUTH_APPS: 'nav.auth-oauth-apps',
  NAV_AUTH_EMAIL: 'nav.auth-email',
  NAV_AUTH_POLICIES: 'nav.auth-policies',
  NAV_AUTH_SIGN_IN: 'nav.auth-sign-in',
  NAV_AUTH_PASSKEYS: 'nav.auth-passkeys',
  NAV_AUTH_OAUTH_SERVER: 'nav.auth-oauth-server',
  NAV_AUTH_SESSIONS: 'nav.auth-sessions',
  NAV_AUTH_RATE_LIMITS: 'nav.auth-rate-limits',
  NAV_AUTH_MFA: 'nav.auth-mfa',
  NAV_AUTH_URL_CONFIGURATION: 'nav.auth-url-configuration',
  NAV_AUTH_PROTECTION: 'nav.auth-protection',
  NAV_AUTH_HOOKS: 'nav.auth-hooks',
  NAV_AUTH_AUDIT_LOGS: 'nav.auth-audit-logs',
  NAV_AUTH_PERFORMANCE: 'nav.auth-performance',
}

export type AuthNavShortcutId = (typeof AUTH_NAV_SHORTCUT_IDS)[keyof typeof AUTH_NAV_SHORTCUT_IDS]

export const authNavRegistry: RegistryDefinations<AuthNavShortcutId> = {
  [AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_OVERVIEW]: {
    id: AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_OVERVIEW,
    label: 'Go to Overview',
    sequence: ['A', 'O'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_AUTH,
  },
  [AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_USERS]: {
    id: AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_USERS,
    label: 'Go to Users',
    sequence: ['A', 'U'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_AUTH,
  },
  [AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_OAUTH_APPS]: {
    id: AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_OAUTH_APPS,
    label: 'Go to OAuth Apps',
    sequence: ['A', 'A'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_AUTH,
  },
  [AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_EMAIL]: {
    id: AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_EMAIL,
    label: 'Go to Email',
    sequence: ['A', 'E'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_AUTH,
  },
  [AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_POLICIES]: {
    id: AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_POLICIES,
    label: 'Go to Policies',
    sequence: ['A', 'P'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_AUTH,
  },
  [AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_SIGN_IN]: {
    id: AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_SIGN_IN,
    label: 'Go to Sign In / Providers',
    sequence: ['A', 'I'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_AUTH,
  },
  [AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_PASSKEYS]: {
    id: AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_PASSKEYS,
    label: 'Go to Passkeys',
    sequence: ['A', 'K'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_AUTH,
  },
  [AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_OAUTH_SERVER]: {
    id: AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_OAUTH_SERVER,
    label: 'Go to OAuth Server',
    sequence: ['A', 'V'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_AUTH,
  },
  [AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_SESSIONS]: {
    id: AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_SESSIONS,
    label: 'Go to Sessions',
    sequence: ['A', 'S'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_AUTH,
  },
  [AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_RATE_LIMITS]: {
    id: AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_RATE_LIMITS,
    label: 'Go to Rate Limits',
    sequence: ['A', 'R'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_AUTH,
  },
  [AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_MFA]: {
    id: AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_MFA,
    label: 'Go to Multi-Factor',
    sequence: ['A', 'M'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_AUTH,
  },
  [AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_URL_CONFIGURATION]: {
    id: AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_URL_CONFIGURATION,
    label: 'Go to URL Configuration',
    sequence: ['A', 'L'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_AUTH,
  },
  [AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_PROTECTION]: {
    id: AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_PROTECTION,
    label: 'Go to Attack Protection',
    sequence: ['A', 'T'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_AUTH,
  },
  [AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_HOOKS]: {
    id: AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_HOOKS,
    label: 'Go to Auth Hooks',
    sequence: ['A', 'H'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_AUTH,
  },
  [AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_AUDIT_LOGS]: {
    id: AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_AUDIT_LOGS,
    label: 'Go to Audit Logs',
    sequence: ['A', 'G'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_AUTH,
  },
  [AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_PERFORMANCE]: {
    id: AUTH_NAV_SHORTCUT_IDS.NAV_AUTH_PERFORMANCE,
    label: 'Go to Performance',
    sequence: ['A', 'F'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_AUTH,
  },
}

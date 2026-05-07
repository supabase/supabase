import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { useGenerateAuthMenu } from '@/components/layouts/AuthLayout/AuthLayout.utils'
import { SHORTCUT_IDS, type ShortcutId } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

export const AuthNavShortcuts = () => {
  const router = useRouter()
  const groups = useGenerateAuthMenu()

  const urlByShortcut = useMemo(() => {
    const map = new Map<ShortcutId, string>()
    for (const group of groups) {
      for (const item of group.items) {
        if (item.shortcutId && item.url) map.set(item.shortcutId, item.url)
      }
    }
    return map
  }, [groups])

  const navigate = useCallback(
    (id: ShortcutId) => {
      const url = urlByShortcut.get(id)
      if (url) router.push(url)
    },
    [router, urlByShortcut]
  )

  useShortcut(SHORTCUT_IDS.NAV_AUTH_OVERVIEW, () => navigate(SHORTCUT_IDS.NAV_AUTH_OVERVIEW), {
    enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_AUTH_OVERVIEW),
  })
  useShortcut(SHORTCUT_IDS.NAV_AUTH_USERS, () => navigate(SHORTCUT_IDS.NAV_AUTH_USERS), {
    enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_AUTH_USERS),
  })
  useShortcut(SHORTCUT_IDS.NAV_AUTH_OAUTH_APPS, () => navigate(SHORTCUT_IDS.NAV_AUTH_OAUTH_APPS), {
    enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_AUTH_OAUTH_APPS),
  })
  useShortcut(SHORTCUT_IDS.NAV_AUTH_EMAIL, () => navigate(SHORTCUT_IDS.NAV_AUTH_EMAIL), {
    enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_AUTH_EMAIL),
  })
  useShortcut(SHORTCUT_IDS.NAV_AUTH_POLICIES, () => navigate(SHORTCUT_IDS.NAV_AUTH_POLICIES), {
    enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_AUTH_POLICIES),
  })
  useShortcut(SHORTCUT_IDS.NAV_AUTH_SIGN_IN, () => navigate(SHORTCUT_IDS.NAV_AUTH_SIGN_IN), {
    enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_AUTH_SIGN_IN),
  })
  useShortcut(SHORTCUT_IDS.NAV_AUTH_PASSKEYS, () => navigate(SHORTCUT_IDS.NAV_AUTH_PASSKEYS), {
    enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_AUTH_PASSKEYS),
  })
  useShortcut(
    SHORTCUT_IDS.NAV_AUTH_OAUTH_SERVER,
    () => navigate(SHORTCUT_IDS.NAV_AUTH_OAUTH_SERVER),
    { enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_AUTH_OAUTH_SERVER) }
  )
  useShortcut(SHORTCUT_IDS.NAV_AUTH_SESSIONS, () => navigate(SHORTCUT_IDS.NAV_AUTH_SESSIONS), {
    enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_AUTH_SESSIONS),
  })
  useShortcut(
    SHORTCUT_IDS.NAV_AUTH_RATE_LIMITS,
    () => navigate(SHORTCUT_IDS.NAV_AUTH_RATE_LIMITS),
    { enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_AUTH_RATE_LIMITS) }
  )
  useShortcut(SHORTCUT_IDS.NAV_AUTH_MFA, () => navigate(SHORTCUT_IDS.NAV_AUTH_MFA), {
    enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_AUTH_MFA),
  })
  useShortcut(
    SHORTCUT_IDS.NAV_AUTH_URL_CONFIGURATION,
    () => navigate(SHORTCUT_IDS.NAV_AUTH_URL_CONFIGURATION),
    { enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_AUTH_URL_CONFIGURATION) }
  )
  useShortcut(SHORTCUT_IDS.NAV_AUTH_PROTECTION, () => navigate(SHORTCUT_IDS.NAV_AUTH_PROTECTION), {
    enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_AUTH_PROTECTION),
  })
  useShortcut(SHORTCUT_IDS.NAV_AUTH_HOOKS, () => navigate(SHORTCUT_IDS.NAV_AUTH_HOOKS), {
    enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_AUTH_HOOKS),
  })
  useShortcut(SHORTCUT_IDS.NAV_AUTH_AUDIT_LOGS, () => navigate(SHORTCUT_IDS.NAV_AUTH_AUDIT_LOGS), {
    enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_AUTH_AUDIT_LOGS),
  })
  useShortcut(
    SHORTCUT_IDS.NAV_AUTH_PERFORMANCE,
    () => navigate(SHORTCUT_IDS.NAV_AUTH_PERFORMANCE),
    { enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_AUTH_PERFORMANCE) }
  )

  return null
}

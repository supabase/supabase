import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { useGenerateDatabaseMenu } from '@/components/layouts/DatabaseLayout/DatabaseMenu.utils'
import { SHORTCUT_IDS, type ShortcutId } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

export const DatabaseNavShortcuts = () => {
  const router = useRouter()
  const groups = useGenerateDatabaseMenu()

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

  useShortcut(SHORTCUT_IDS.NAV_DATABASE_TABLES, () => navigate(SHORTCUT_IDS.NAV_DATABASE_TABLES), {
    enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_DATABASE_TABLES),
  })
  useShortcut(
    SHORTCUT_IDS.NAV_DATABASE_FUNCTIONS,
    () => navigate(SHORTCUT_IDS.NAV_DATABASE_FUNCTIONS),
    { enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_DATABASE_FUNCTIONS) }
  )
  useShortcut(
    SHORTCUT_IDS.NAV_DATABASE_TRIGGERS,
    () => navigate(SHORTCUT_IDS.NAV_DATABASE_TRIGGERS),
    { enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_DATABASE_TRIGGERS) }
  )
  useShortcut(
    SHORTCUT_IDS.NAV_DATABASE_INDEXES,
    () => navigate(SHORTCUT_IDS.NAV_DATABASE_INDEXES),
    { enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_DATABASE_INDEXES) }
  )
  useShortcut(
    SHORTCUT_IDS.NAV_DATABASE_EXTENSIONS,
    () => navigate(SHORTCUT_IDS.NAV_DATABASE_EXTENSIONS),
    { enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_DATABASE_EXTENSIONS) }
  )
  useShortcut(
    SHORTCUT_IDS.NAV_DATABASE_SCHEMA_VISUALIZER,
    () => navigate(SHORTCUT_IDS.NAV_DATABASE_SCHEMA_VISUALIZER),
    { enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_DATABASE_SCHEMA_VISUALIZER) }
  )
  useShortcut(SHORTCUT_IDS.NAV_DATABASE_ROLES, () => navigate(SHORTCUT_IDS.NAV_DATABASE_ROLES), {
    enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_DATABASE_ROLES),
  })
  useShortcut(
    SHORTCUT_IDS.NAV_DATABASE_BACKUPS,
    () => navigate(SHORTCUT_IDS.NAV_DATABASE_BACKUPS),
    { enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_DATABASE_BACKUPS) }
  )
  useShortcut(
    SHORTCUT_IDS.NAV_DATABASE_MIGRATIONS,
    () => navigate(SHORTCUT_IDS.NAV_DATABASE_MIGRATIONS),
    { enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_DATABASE_MIGRATIONS) }
  )
  useShortcut(SHORTCUT_IDS.NAV_DATABASE_TYPES, () => navigate(SHORTCUT_IDS.NAV_DATABASE_TYPES), {
    enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_DATABASE_TYPES),
  })
  useShortcut(
    SHORTCUT_IDS.NAV_DATABASE_PUBLICATIONS,
    () => navigate(SHORTCUT_IDS.NAV_DATABASE_PUBLICATIONS),
    { enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_DATABASE_PUBLICATIONS) }
  )
  useShortcut(
    SHORTCUT_IDS.NAV_DATABASE_COLUMN_PRIVILEGES,
    () => navigate(SHORTCUT_IDS.NAV_DATABASE_COLUMN_PRIVILEGES),
    { enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_DATABASE_COLUMN_PRIVILEGES) }
  )
  useShortcut(
    SHORTCUT_IDS.NAV_DATABASE_SETTINGS,
    () => navigate(SHORTCUT_IDS.NAV_DATABASE_SETTINGS),
    { enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_DATABASE_SETTINGS) }
  )
  useShortcut(
    SHORTCUT_IDS.NAV_DATABASE_REPLICATION,
    () => navigate(SHORTCUT_IDS.NAV_DATABASE_REPLICATION),
    { enabled: urlByShortcut.has(SHORTCUT_IDS.NAV_DATABASE_REPLICATION) }
  )

  return null
}

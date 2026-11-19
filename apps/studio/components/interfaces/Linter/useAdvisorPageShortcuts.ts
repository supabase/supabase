import { useRouter } from 'next/router'

import { LINTER_LEVELS } from './Linter.constants'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

interface UseAdvisorPageShortcutsParams {
  setCurrentTab: (level: LINTER_LEVELS) => void
  refetch: () => void
  hasSelectedLint: boolean
  isRefreshDisabled: boolean
}

export function useAdvisorPageShortcuts({
  setCurrentTab,
  refetch,
  hasSelectedLint,
  isRefreshDisabled,
}: UseAdvisorPageShortcutsParams) {
  const router = useRouter()

  const switchTab = (level: LINTER_LEVELS) => {
    setCurrentTab(level)
    const { sort, search, id, ...rest } = router.query
    router.push({ ...router, query: { ...rest, preset: level } })
  }

  useShortcut(SHORTCUT_IDS.ADVISORS_TAB_ERRORS, () => switchTab(LINTER_LEVELS.ERROR))
  useShortcut(SHORTCUT_IDS.ADVISORS_TAB_WARNINGS, () => switchTab(LINTER_LEVELS.WARN))
  useShortcut(SHORTCUT_IDS.ADVISORS_TAB_INFO, () => switchTab(LINTER_LEVELS.INFO))

  useShortcut(SHORTCUT_IDS.ADVISORS_REFRESH, refetch, {
    enabled: !isRefreshDisabled,
    label: 'Refresh advisor',
  })

  useShortcut(
    SHORTCUT_IDS.ADVISORS_CLOSE_DETAIL,
    () => {
      const { id, ...rest } = router.query
      router.push({ query: rest })
    },
    { enabled: hasSelectedLint }
  )
}

import { type AnyRouter, useLocation, useNavigate } from '@tanstack/react-router'

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
  const navigate = useNavigate()
  const pathname = useLocation({ select: (location) => location.pathname })

  const switchTab = (level: LINTER_LEVELS) => {
    setCurrentTab(level)
    navigate<AnyRouter, string>({
      to: pathname,
      search: (prev: Record<string, unknown>) => {
        const { sort: _sort, search: _search, id: _id, ...rest } = prev
        return { ...rest, preset: level }
      },
    })
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
      navigate<AnyRouter, string>({
        to: pathname,
        search: (prev: Record<string, unknown>) => {
          const { id: _id, ...rest } = prev
          return rest
        },
      })
    },
    { enabled: hasSelectedLint }
  )
}

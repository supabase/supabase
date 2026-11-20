import { parseAsBoolean, useQueryState } from 'nuqs'
import { useSetCommandMenuOpen } from 'ui-patterns/CommandMenu'

import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import { useAppStateSnapshot } from '@/state/app-state'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

export function useConnectSheetShortcut() {
  const setCommandMenuOpen = useSetCommandMenuOpen()
  const { data: selectedProject } = useSelectedProjectQuery()
  const { setConnectSheetSource } = useAppStateSnapshot()
  const [, setShowConnect] = useQueryState('showConnect', parseAsBoolean.withDefault(false))
  const enabled = selectedProject?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  useShortcut(
    SHORTCUT_IDS.CONNECT_OPEN_SHEET,
    () => {
      setConnectSheetSource('keyboard_shortcut')
      setCommandMenuOpen(false)
      setShowConnect(true)
    },
    { enabled }
  )
}

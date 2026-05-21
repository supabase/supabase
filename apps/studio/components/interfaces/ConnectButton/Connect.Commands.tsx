import { Plug } from 'lucide-react'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { Fragment } from 'react'
import { KeyboardShortcut } from 'ui'
import type { ICommand } from 'ui-patterns/CommandMenu'
import { useRegisterCommands, useSetCommandMenuOpen } from 'ui-patterns/CommandMenu'

import { COMMAND_MENU_SECTIONS } from '@/components/interfaces/App/CommandMenu/CommandMenu.utils'
import { orderCommandSectionsByPriority } from '@/components/interfaces/App/CommandMenu/ordering'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import { hotkeyToKeys } from '@/state/shortcuts/formatShortcut'
import { SHORTCUT_DEFINITIONS, SHORTCUT_IDS } from '@/state/shortcuts/registry'

const ConnectShortcutBadge = () => (
  <div className="flex items-center gap-1">
    {SHORTCUT_DEFINITIONS[SHORTCUT_IDS.CONNECT_OPEN_SHEET].sequence.map((step, index) => (
      <Fragment key={`${step}-${index}`}>
        {index > 0 && <span className="text-foreground-lighter text-[11px]">then</span>}
        <KeyboardShortcut keys={hotkeyToKeys(step)} />
      </Fragment>
    ))}
  </div>
)

export function useConnectCommands() {
  const setIsOpen = useSetCommandMenuOpen()
  const { data: selectedProject } = useSelectedProjectQuery()
  const isActiveHealthy = selectedProject?.status === PROJECT_STATUS.ACTIVE_HEALTHY
  const enabled = !!selectedProject && isActiveHealthy

  const [, setShowConnect] = useQueryState('showConnect', parseAsBoolean.withDefault(false))
  const [, setConnectTab] = useQueryState('connectTab', parseAsString)

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.ACTIONS,
    [
      {
        id: 'connect-to-project',
        name: 'Connect to your project',
        action: () => {
          setShowConnect(true)
          setIsOpen(false)
        },
        icon: () => <Plug className="rotate-90" />,
        badge: ConnectShortcutBadge,
      },
      {
        id: 'connect-mcp',
        name: 'Connect via MCP',
        action: () => {
          setShowConnect(true)
          setConnectTab('mcp')
          setIsOpen(false)
        },
        icon: () => <Plug className="rotate-90" />,
      },
    ] as ICommand[],
    {
      enabled,
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 2 },
    }
  )
}

import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import { orderCommandSectionsByPriority } from 'components/interfaces/App/CommandMenu/ordering'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import { Plug } from 'lucide-react'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import type { ICommand } from 'ui-patterns/CommandMenu'
import { useRegisterCommands, useSetCommandMenuOpen } from 'ui-patterns/CommandMenu'

export function useConnectCommands() {
  const setIsOpen = useSetCommandMenuOpen()
  const { data: selectedProject } = useSelectedProjectQuery()
  const isActiveHealthy = selectedProject?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  const [_, setShowConnect] = useQueryState('showConnect', parseAsBoolean.withDefault(false))
  const [__, setConnectTab] = useQueryState('connectTab', parseAsString)

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
      enabled: !!selectedProject && isActiveHealthy,
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 2 },
    }
  )
}

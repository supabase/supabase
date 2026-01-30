import { Plug } from 'lucide-react'
import { useRouter } from 'next/router'

import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import type { ICommand } from 'ui-patterns/CommandMenu'
import { useRegisterCommands, useSetCommandMenuOpen } from 'ui-patterns/CommandMenu'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import { orderCommandSectionsByPriority } from 'components/interfaces/App/CommandMenu/ordering'

export function useConnectCommands() {
  const router = useRouter()
  const setIsOpen = useSetCommandMenuOpen()
  const { data: selectedProject } = useSelectedProjectQuery()
  const isActiveHealthy = selectedProject?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.ACTIONS,
    [
      {
        id: 'connect-to-project',
        name: 'Connect to your project',
        action: () => {
          router.push(
            {
              pathname: router.pathname,
              query: { ...router.query, showConnect: 'true' },
            },
            undefined,
            { shallow: true }
          )
          setIsOpen(false)
        },
        icon: () => <Plug className="rotate-90" />,
      },
      {
        id: 'connect-mcp',
        name: 'Connect via MCP',
        action: () => {
          router.push(
            {
              pathname: router.pathname,
              query: { ...router.query, showConnect: 'true', connectTab: 'mcp' },
            },
            undefined,
            { shallow: true }
          )
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

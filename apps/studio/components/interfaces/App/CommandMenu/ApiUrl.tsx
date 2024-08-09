import { Link } from 'lucide-react'

import { useProjectApiQuery } from 'data/config/project-api-query'
import { copyToClipboard } from 'lib/helpers'
import { Badge } from 'ui'
import { useRegisterCommands, useSetCommandMenuOpen } from 'ui-patterns/CommandMenu'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { COMMAND_MENU_SECTIONS } from './CommandMenu.utils'
import { orderCommandSectionsByPriority } from './ordering'

export function useApiUrlCommand() {
  const setIsOpen = useSetCommandMenuOpen()

  const project = useSelectedProject()
  const { data: settings } = useProjectApiQuery(
    { projectRef: project?.ref },
    { enabled: !!project }
  )

  const apiUrl = settings?.autoApiService.endpoint
    ? `${settings.autoApiService.protocol ?? 'https'}://${settings.autoApiService.endpoint}`
    : undefined

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.ACTIONS,
    [
      {
        id: 'api-url',
        name: 'Copy API URL',
        action: () => {
          copyToClipboard(apiUrl ?? '')
          setIsOpen(false)
        },
        icon: () => <Link />,
        badge: () => <Badge>Project: {project?.name}</Badge>,
      },
    ],
    {
      enabled: !!project,
      deps: [apiUrl, project],
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 3 },
    }
  )
}

import { Link } from 'lucide-react'

import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { copyToClipboard } from 'lib/helpers'
import { Badge } from 'ui'
import { useRegisterCommands, useSetCommandMenuOpen } from 'ui-patterns/CommandMenu'
import { COMMAND_MENU_SECTIONS } from './CommandMenu.utils'
import { orderCommandSectionsByPriority } from './ordering'

export function useApiUrlCommand() {
  const setIsOpen = useSetCommandMenuOpen()

  const project = useSelectedProject()
  const { data: settings } = useProjectSettingsV2Query(
    { projectRef: project?.ref },
    { enabled: !!project }
  )

  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.endpoint
  const apiUrl = endpoint ? `${protocol}://${endpoint}` : undefined

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

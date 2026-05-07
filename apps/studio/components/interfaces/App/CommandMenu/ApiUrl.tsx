import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Link } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, copyToClipboard } from 'ui'
import {
  useRegisterCommands,
  useResetCommandMenu,
  useSetCommandMenuOpen,
} from 'ui-patterns/CommandMenu'

import { COMMAND_MENU_SECTIONS } from './CommandMenu.utils'
import { orderCommandSectionsByPriority } from './ordering'

export function useApiUrlCommand() {
  const setIsOpen = useSetCommandMenuOpen()
  const resetCommandMenu = useResetCommandMenu()

  const { data: project } = useSelectedProjectQuery()
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
          copyToClipboard(apiUrl ?? '', () => {
            toast.success('API URL copied to clipboard')
          })
          setIsOpen(false)
          resetCommandMenu()
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

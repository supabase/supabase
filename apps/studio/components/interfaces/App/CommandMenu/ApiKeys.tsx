import { Key } from 'lucide-react'
import { useMemo } from 'react'

import { getAPIKeys, useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { copyToClipboard } from 'lib/helpers'
import { Badge } from 'ui'
import type { ICommand } from 'ui-patterns/CommandMenu'
import {
  PageType,
  useRegisterCommands,
  useRegisterPage,
  useSetCommandMenuOpen,
  useSetPage,
} from 'ui-patterns/CommandMenu'
import { COMMAND_MENU_SECTIONS } from './CommandMenu.utils'
import { orderCommandSectionsByPriority } from './ordering'

const API_KEYS_PAGE_NAME = 'API Keys'

export function useApiKeysCommands() {
  const setIsOpen = useSetCommandMenuOpen()
  const setPage = useSetPage()

  const project = useSelectedProject()
  const ref = project?.ref || '_'

  const { data: settings } = useProjectSettingsV2Query(
    { projectRef: project?.ref },
    { enabled: !!project }
  )
  const { anonKey, serviceKey } = getAPIKeys(settings)

  const commands = useMemo(
    () =>
      [
        project &&
          anonKey && {
            id: 'anon-key',
            name: `Copy anonymous API key`,
            action: () => {
              copyToClipboard(anonKey.api_key ?? '')
              setIsOpen(false)
            },
            badge: () => (
              <span className="flex items-center gap-2">
                <Badge>Project: {project?.name}</Badge>
                <Badge>Public</Badge>
              </span>
            ),
            icon: () => <Key />,
          },
        project &&
          serviceKey && {
            id: 'service-key',
            name: `Copy service API key`,
            action: () => {
              copyToClipboard(serviceKey.api_key ?? '')
              setIsOpen(false)
            },
            badge: () => (
              <span className="flex items-center gap-2">
                <Badge>Project: {project?.name}</Badge>
                <Badge variant="destructive">Secret</Badge>
              </span>
            ),
            icon: () => <Key />,
          },
        !(anonKey || serviceKey) && {
          id: 'api-keys-project-settings',
          name: 'See API keys in Project Settings',
          route: `/project/${ref}/settings/api`,
          icon: () => <Key />,
        },
      ].filter(Boolean) as ICommand[],
    [anonKey, serviceKey, project, setIsOpen]
  )

  useRegisterPage(
    API_KEYS_PAGE_NAME,
    {
      type: PageType.Commands,
      sections: [
        {
          id: 'api-keys',
          name: 'API keys',
          commands,
        },
      ],
    },
    { deps: [commands], enabled: !!project }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.ACTIONS,
    [
      {
        id: 'api-keys',
        name: 'Get API keys',
        action: () => setPage(API_KEYS_PAGE_NAME),
        icon: () => <Key />,
      },
    ],
    {
      enabled: !!project,
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 3 },
    }
  )
}

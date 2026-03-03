import { PermissionAction } from '@supabase/shared-types/out/constants'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Key } from 'lucide-react'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { Badge, copyToClipboard } from 'ui'
import type { ICommand } from 'ui-patterns/CommandMenu'
import {
  PageType,
  useRegisterCommands,
  useRegisterPage,
  useResetCommandMenu,
  useSetCommandMenuOpen,
  useSetPage,
} from 'ui-patterns/CommandMenu'

import { COMMAND_MENU_SECTIONS } from './CommandMenu.utils'
import { orderCommandSectionsByPriority } from './ordering'

const API_KEYS_PAGE_NAME = 'API Keys'

export function useApiKeysCommands() {
  const setIsOpen = useSetCommandMenuOpen()
  const resetCommandMenu = useResetCommandMenu()
  const setPage = useSetPage()

  const { data: project } = useSelectedProjectQuery()
  const ref = project?.ref || '_'

  const { can: canReadAPIKeys, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.SECRETS_READ,
    '*'
  )

  const { data: apiKeys } = useAPIKeysQuery(
    { projectRef: project?.ref, reveal: true },
    { enabled: canReadAPIKeys }
  )
  const commands = useMemo(() => {
    const { anonKey, serviceKey, publishableKey, allSecretKeys } = canReadAPIKeys
      ? getKeys(apiKeys)
      : {}

    return [
      project &&
        publishableKey && {
          id: 'publishable-key',
          name: `Copy publishable key`,
          action: () => {
            copyToClipboard(publishableKey.api_key ?? '', () => {
              toast.success('Publishable key copied to clipboard')
            })
            setIsOpen(false)
            resetCommandMenu()
          },
          badge: () => (
            <span className="flex items-center gap-x-1">
              <Badge>Project: {project?.name}</Badge>
              <Badge>{publishableKey.type}</Badge>
            </span>
          ),
          icon: () => <Key />,
        },
      ...(project && allSecretKeys
        ? allSecretKeys.map((key) => ({
            id: key.id,
            name: `Copy secret key (${key.name})`,
            action: () => {
              copyToClipboard(key.api_key ?? '', () => {
                toast.success('Secret key copied to clipboard')
              })
              setIsOpen(false)
              resetCommandMenu()
            },
            badge: () => (
              <span className="flex items-center gap-x-1">
                <Badge>Project: {project?.name}</Badge>
                <Badge>{key.type}</Badge>
              </span>
            ),
            icon: () => <Key />,
          }))
        : []),
      project &&
        anonKey && {
          id: 'anon-key',
          name: `Copy anonymous API key`,
          action: () => {
            copyToClipboard(anonKey.api_key ?? '', () => {
              toast.success('Anonymous API key copied to clipboard')
            })
            setIsOpen(false)
            resetCommandMenu()
          },
          badge: () => (
            <span className="flex items-center gap-x-1">
              <Badge>Project: {project?.name}</Badge>
              <Badge>Public</Badge>
              <Badge>{anonKey.type}</Badge>
            </span>
          ),
          icon: () => <Key />,
        },
      project &&
        serviceKey && {
          id: 'service-key',
          name: `Copy service API key`,
          action: () => {
            copyToClipboard(serviceKey.api_key ?? '', () => {
              toast.success('Service key copied to clipboard')
            })
            setIsOpen(false)
            resetCommandMenu()
          },
          badge: () => (
            <span className="flex items-center gap-x-1">
              <Badge>Project: {project?.name}</Badge>
              <Badge variant="destructive">Secret</Badge>
              <Badge>{serviceKey.type}</Badge>
            </span>
          ),
          icon: () => <Key />,
        },
      !(anonKey || serviceKey) && {
        id: 'api-keys-project-settings',
        name: 'See API keys in Project Settings',
        route: `/project/${ref}/settings/api-keys`,
        icon: () => <Key />,
      },
    ].filter(Boolean) as ICommand[]
  }, [apiKeys, canReadAPIKeys, project, ref, resetCommandMenu, setIsOpen])

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
    { deps: [commands], enabled: !!project && commands.length > 0 }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.ACTIONS,
    [
      {
        id: 'api-keys',
        name: 'Get API keys...',
        action: () => setPage(API_KEYS_PAGE_NAME),
        icon: () => <Key />,
      },
    ],
    {
      enabled: !!project && commands.length > 0,
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 3 },
    }
  )
}

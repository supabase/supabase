import { useQuery } from '@tanstack/react-query'
import { KeyIcon } from 'lucide-react'
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
import { getKeys, revealedApiKeysQueryOptions } from '@/data/api-keys/api-keys-query'
import { useHighAvailability } from '@/hooks/misc/useHighAvailability'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useGrant } from '@/lib/grants'

const API_KEYS_PAGE_NAME = 'API Keys'

export function useApiKeysCommands() {
  const setIsOpen = useSetCommandMenuOpen()
  const resetCommandMenu = useResetCommandMenu()
  const setPage = useSetPage()

  const { data: project } = useSelectedProjectQuery()
  const ref = project?.ref || '_'

  const { isHighAvailability } = useHighAvailability()

  // The commands copy secret key values, so this needs the `reveal` grant
  const apiKeysGrant = useGrant(
    'GET /v1/projects/{ref}/api-keys',
    { projectRef: project?.ref },
    { variant: 'reveal' }
  )
  const { data: apiKeysData } = useQuery(
    revealedApiKeysQueryOptions(
      { projectRef: project?.ref, grant: apiKeysGrant.grant },
      { select: getKeys }
    )
  )
  const commands = useMemo(() => {
    const {
      anonKey: legacyAnonKey,
      serviceKey: legacyServiceKey,
      publishableKey,
      allSecretKeys,
    } = apiKeysData ?? {}

    const anonKey = isHighAvailability ? undefined : legacyAnonKey
    const serviceKey = isHighAvailability ? undefined : legacyServiceKey

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
          icon: () => <KeyIcon />,
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
            icon: () => <KeyIcon />,
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
          icon: () => <KeyIcon />,
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
          icon: () => <KeyIcon />,
        },
      !(anonKey || serviceKey) && {
        id: 'api-keys-project-settings',
        name: 'See API keys in Project Settings',
        route: `/project/${ref}/settings/api-keys`,
        icon: () => <KeyIcon />,
      },
    ].filter(Boolean) as ICommand[]
  }, [apiKeysData, isHighAvailability, project, ref, resetCommandMenu, setIsOpen])

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
        icon: () => <KeyIcon />,
      },
    ],
    {
      enabled: !!project && commands.length > 0,
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 3 },
    }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-api-keys',
        name: 'Go to API Keys',
        route: `/project/${ref}/settings/api-keys`,
        icon: () => <KeyIcon />,
      },
    ],
    { enabled: !!project }
  )
}

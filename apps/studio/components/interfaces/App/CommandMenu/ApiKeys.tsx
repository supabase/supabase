import { useParams } from 'common'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { copyToClipboard } from 'lib/helpers'
import { Key } from 'lucide-react'
import { useMemo } from 'react'
import { Badge } from 'ui'
import {
  type ICommand,
  useSetCommandMenuOpen,
  useRegisterCommands,
  useRegisterPage,
  PageType,
  useSetPage,
} from 'ui-patterns/CommandMenu'

const API_KEYS_PAGE_NAME = 'api-keys'

const useApiKeysCommands = () => {
  const setIsOpen = useSetCommandMenuOpen()
  const setPage = useSetPage()

  const { ref } = useParams()
  const { data: settings } = useProjectApiQuery({ projectRef: ref }, { enabled: !!ref })

  const anonKey = settings?.autoApiService?.defaultApiKey ?? undefined
  const serviceKey = settings?.autoApiService?.serviceApiKey ?? undefined

  const commands = useMemo(
    () =>
      [
        anonKey && {
          id: 'anon-key',
          name: 'Copy anonymous API key',
          action: () => {
            copyToClipboard(anonKey ?? '')
            setIsOpen(false)
          },
          badge: () => <Badge>Public</Badge>,
          icon: () => <Key />,
        },
        serviceKey && {
          id: 'service-key',
          name: 'Copy service API key',
          action: () => {
            copyToClipboard(serviceKey ?? '')
            setIsOpen(false)
          },
          badge: () => <Badge variant="destructive">Secret</Badge>,
          icon: () => <Key />,
        },
        !(anonKey || serviceKey) && {
          id: 'api-keys-project-settings',
          name: 'See API keys in Project Settings',
          route: `/project/${ref ?? '_'}/settings/api`,
          icon: () => <Key />,
        },
      ].filter(Boolean) as ICommand[],
    [anonKey, serviceKey, ref, setIsOpen]
  )

  useRegisterPage(
    API_KEYS_PAGE_NAME,
    {
      type: PageType.Commands,
      commands: [
        {
          id: 'api-keys',
          name: 'API keys',
          commands,
        },
      ],
    },
    [commands]
  )
  useRegisterCommands('Project tools', [
    {
      id: 'api-keys',
      name: 'Get API keys',
      action: () => setPage(API_KEYS_PAGE_NAME),
      icon: () => <Key />,
    },
  ])
}

export { useApiKeysCommands }

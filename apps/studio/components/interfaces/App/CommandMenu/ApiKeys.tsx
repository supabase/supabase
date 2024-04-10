import { useParams } from 'common'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { copyToClipboard } from 'lib/helpers'
import { useMemo } from 'react'
import { Badge } from 'ui'
import { type ICommand, useSetCommandMenuOpen, useRegisterCommands } from 'ui-patterns/CommandMenu'

const useApiKeysCommands = () => {
  const setIsOpen = useSetCommandMenuOpen()

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
          defaultHidden: true,
        },
        serviceKey && {
          id: 'service-key',
          name: 'Copy service API key',
          action: () => {
            copyToClipboard(serviceKey ?? '')
            setIsOpen(false)
          },
          badge: () => <Badge variant="destructive">Secret</Badge>,
          defaultHidden: true,
        },
        !(anonKey || serviceKey) && {
          id: 'api-keys-project-settings',
          name: 'See API keys in Project Settings',
          route: `/dashboard/project/${ref ?? '_'}/settings/general`,
          defaultHidden: true,
        },
      ].filter(Boolean) as ICommand[],
    [anonKey, serviceKey, ref, setIsOpen]
  )

  useRegisterCommands('Project tools', commands, { deps: [anonKey, serviceKey, ref] })
}

export { useApiKeysCommands }

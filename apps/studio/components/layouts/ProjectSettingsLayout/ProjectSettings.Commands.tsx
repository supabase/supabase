import { useParams } from 'common'
import { useRouter } from 'next/router'
import type { CommandOptions, ICommand } from 'ui-patterns/CommandMenu'
import { useRegisterCommands, useSetCommandMenuOpen } from 'ui-patterns/CommandMenu'
import { IRouteCommand } from 'ui-patterns/CommandMenu/internal/types'

import { COMMAND_MENU_SECTIONS } from '@/components/interfaces/App/CommandMenu/CommandMenu.utils'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

export function useProjectSettingsGotoCommands(options?: CommandOptions) {
  const router = useRouter()
  const setIsOpen = useSetCommandMenuOpen()
  let { ref } = useParams()
  ref ||= '_'

  const { projectSettingsLogDrains, projectSettingsCustomDomains, authenticationSignInProviders } =
    useIsFeatureEnabled([
      'project_settings:log_drains',
      'project_settings:custom_domains',
      'authentication:sign_in_providers',
    ])

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-project-settings-general',
        name: 'General Settings',
        route: `/project/${ref}/settings/general`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-database',
        name: 'Database Settings',
        route: `/project/${ref}/database/settings`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-auth',
        name: 'Auth Settings',
        route: authenticationSignInProviders
          ? `/project/${ref}/auth/providers`
          : `/project/${ref}/auth/policies`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-api',
        name: 'API Settings',
        route: `/project/${ref}/integrations/data_api/settings`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-storage',
        name: 'Storage Settings',
        route: `/project/${ref}/storage/settings`,
        defaultHidden: true,
      },
      ...(projectSettingsCustomDomains
        ? [
            {
              id: 'nav-project-settings-custom-domains',
              name: 'Custom Domains',
              route: `/project/${ref}/settings/general#custom-domains`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      {
        id: 'nav-project-settings-restart-project',
        name: 'Restart project',
        route: `/project/${ref}/settings/general#restart-project`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-pause-project',
        name: 'Pause project',
        route: `/project/${ref}/settings/general#pause-project`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-transfer-project',
        name: 'Transfer project',
        route: `/project/${ref}/settings/general#transfer-project`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-delete-project',
        name: 'Delete project',
        route: `/project/${ref}/settings/general#delete-project`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-database-password',
        name: 'Database password',
        route: `/project/${ref}/database/settings#database-password`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-connection-string',
        name: 'Connection string',
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
        defaultHidden: true,
      } as ICommand,
      {
        id: 'nav-project-settings-connection-pooling',
        name: 'Connection pooling',
        route: `/project/${ref}/database/settings#connection-pooler`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-ssl-configuration',
        name: 'SSL configuration',
        route: `/project/${ref}/database/settings#ssl-configuration`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-network-restrictions',
        name: 'Network restrictions',
        route: `/project/${ref}/database/settings#network-restrictions`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-banned-ips',
        name: 'Banned IPs',
        route: `/project/${ref}/database/settings#banned-ips`,
        defaultHidden: true,
      },
      ...(projectSettingsLogDrains
        ? [
            {
              id: 'nav-project-settings-log-drains',
              name: 'Log drains',
              route: `/project/${ref}/settings/log-drains`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
    ],
    { ...options, deps: [ref] }
  )
}

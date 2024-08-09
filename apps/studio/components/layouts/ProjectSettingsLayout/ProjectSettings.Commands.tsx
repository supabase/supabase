import { useParams } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

export function useProjectSettingsGotoCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'

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
        route: `/project/${ref}/settings/database`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-auth',
        name: 'Auth Settings',
        route: `/project/${ref}/settings/auth`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-api',
        name: 'API Settings',
        route: `/project/${ref}/settings/api`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-storage',
        name: 'Storage Settings',
        route: `/project/${ref}/settings/storage`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-custom-domains',
        name: 'Custom Domains',
        route: `/project/${ref}/settings/general#custom-domains`,
        defaultHidden: true,
      },
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
        route: `/project/${ref}/settings/general#database-password`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-connection-string',
        name: 'Connection string',
        route: `/project/${ref}/settings/general#connection-string`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-connection-pooling',
        name: 'Connection pooling',
        route: `/project/${ref}/settings/general#connection-pooling`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-ssl-configuration',
        name: 'SSL configuration',
        route: `/project/${ref}/settings/general#ssl-configuration`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-network-restrictions',
        name: 'Network restrictions',
        route: `/project/${ref}/settings/general#network-restrictions`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-banned-ips',
        name: 'Banned IPs',
        route: `/project/${ref}/settings/general#banned-ips`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-log-drains',
        name: 'Log drains',
        route: `/project/${ref}/settings/log-drains`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [ref] }
  )
}

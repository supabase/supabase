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
        route: `/project/${ref}/auth/providers`,
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
        id: 'nav-project-settings-project-usage',
        name: 'Project usage',
        route: `/project/${ref}/settings/general#project-usage`,
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
        route: `/project/${ref}/settings/database#network-restrictions`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-network-bans',
        name: 'Network bans',
        route: `/project/${ref}/settings/database#network-bans`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-banned-ips',
        name: 'Banned IPs',
        route: `/project/${ref}/settings/database#banned-ips`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-log-drains',
        name: 'Log drains',
        route: `/project/${ref}/settings/log-drains`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-advanced-disk-settings',
        name: 'Advanced disk settings',
        route: `/project/${ref}/settings/compute-and-disk#advanced-disk-settings`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-infrastructure',
        name: 'Infrastructure',
        route: `/project/${ref}/settings/infrastructure`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-integrations',
        name: 'Settings integrations (Github & Vercel)',
        route: `/project/${ref}/settings/integrations`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-api-keys',
        name: 'API Keys',
        route: `/project/${ref}/settings/api-keys`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-disable-legacy-api-keys',
        name: 'Disable legacy API keys',
        route: `/project/${ref}/settings/api-keys#disable-legacy-api-keys`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-jwt-keys',
        name: 'JWT keys',
        route: `/project/${ref}/settings/jwt`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-generate-jwt-keys',
        name: 'Generate a new JWT key',
        route: `/project/${ref}/settings/jwt#generate-jwt`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-add-ons',
        name: 'Add ons',
        route: `/project/${ref}/settings/addons`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-add-ons-dedicated-ipv4',
        name: 'Dedicated IPv4 address',
        route: `/project/${ref}/settings/addons#dedicated-ipv4`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-add-ons-change-ipv4',
        name: 'Change dedicated IPv4 address',
        route: `/project/${ref}/settings/addons?panel=ipv4`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-add-ons-pitr',
        name: 'Point in time recovery',
        route: `/project/${ref}/settings/addons#pitr`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-add-ons-change-pitr',
        name: 'Change point in time recovery',
        route: `/project/${ref}/settings/addons?panel=pitr`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-add-ons-change-custom-domain',
        name: 'Change custom domain',
        route: `/project/${ref}/settings/addons?panel=customDomain`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-reset-database',
        name: 'Reset database password',
        route: `/project/${ref}/settings/database#database-password`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-connection-pooling-configuration',
        name: 'Connection pooling configuration',
        route: `/project/${ref}/settings/database#connection-pooler`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-s3-connection',
        name: 'S3 connection',
        route: `/project/${ref}/settings/storage#s3-connection-form`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-s3-access-keys',
        name: 'S3 access keys',
        route: `/project/${ref}/settings/storage#s3-access-keys`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [ref] }
  )
}

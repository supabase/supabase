import { LOG_TYPE_LABEL_MAPPING } from 'components/interfaces/Settings/Logs'
import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'

export const generateSettingsMenu = (ref: string): ProductMenuGroup[] => {
  const logTypes: string[] = ['database', 'api']

  return [
    {
      title: 'Project settings',
      items: [
        { name: 'General', key: 'general', url: `/project/${ref}/settings/general`, items: [] },
        { name: 'Database', key: 'database', url: `/project/${ref}/settings/database`, items: [] },
        { name: 'API', key: 'api', url: `/project/${ref}/settings/api`, items: [] },
        { name: 'Authentication', key: 'auth', url: `/project/${ref}/auth/settings`, items: [] },
        // TODO(thebengeu): Uncomment once all tenants migrated to multitenant storage API.
        // {
        //   name: 'Storage',
        //   key: 'storage',
        //   url: `/project/${ref}/storage/settings`,
        //   items: [],
        // },
        {
          name: 'Billing & Usage',
          key: 'billing',
          url: `/project/${ref}/settings/billing`,
          items: [],
        },
      ],
    },
    {
      title: 'Logs',
      items: logTypes.map((type: string) => ({
        name: LOG_TYPE_LABEL_MAPPING[type],
        key: `logs-${type}`,
        url: `/project/${ref}/settings/logs/${type}`,
        items: [],
      })),
    },
  ]
}

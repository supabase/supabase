import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { LOG_TYPE_LABEL_MAPPING } from 'lib/constants'

export const generateSettingsMenu = (ref: string): ProductMenuGroup[] => {
  return [
    {
      title: 'Project settings',
      items: [
        { name: 'General', key: 'general', url: `/project/${ref}/settings/general`, items: [] },
        { name: 'Database', key: 'database', url: `/project/${ref}/settings/database`, items: [] },
        { name: 'API', key: 'api', url: `/project/${ref}/settings/api`, items: [] },
        { name: 'Auth Settings', key: 'auth', url: `/project/${ref}/auth/settings`, items: [] },
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
      // items: ['database', 'auth', 'realtime', 'rest', 'storage'].map((type: string) => {
      items: ['database', 'rest'].map((type: string) => {
        return {
          name: LOG_TYPE_LABEL_MAPPING[type],
          key: `logs-${type}`,
          url: `/project/${ref}/settings/logs/${type}`,
          items: [],
        }
      }),
    },
  ]
}

import { IS_PLATFORM } from 'lib/constants'
import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'

export const generateAuthMenu = (ref: string): ProductMenuGroup[] => {
  return [
    {
      title: 'Manage',
      items: [{ name: 'Users', key: 'users', url: `/project/${ref}/auth/users`, items: [] }],
    },

    {
      title: 'Configuration',
      items: [
        {
          name: 'Policies',
          key: 'policies',
          url: `/project/${ref}/auth/policies`,
          items: [],
        },
        ...(IS_PLATFORM
          ? [
              {
                name: 'Providers',
                key: 'providers',
                url: `/project/${ref}/auth/providers`,
                items: [],
              },
              {
                name: 'Rate Limits',
                key: 'rate-limits',
                url: `/project/${ref}/auth/rate-limits`,
                items: [],
              },
              {
                name: 'Email Templates',
                key: 'templates',
                url: `/project/${ref}/auth/templates`,
                items: [],
              },

              {
                name: 'URL Configuration',
                key: 'url-configuration',
                url: `/project/${ref}/auth/url-configuration`,
                items: [],
              },
            ]
          : []),
      ],
    },
  ]
}

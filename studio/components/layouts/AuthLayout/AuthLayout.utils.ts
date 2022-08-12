import { IS_PLATFORM } from 'lib/constants'
import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'

export const generateAuthMenu = (ref: string): ProductMenuGroup[] => {
  return [
    {
      title: 'General',
      items: [
        { name: 'Users', key: 'users', url: `/project/${ref}/auth/users`, items: [] },
        { name: 'Policies', key: 'policies', url: `/project/${ref}/auth/policies`, items: [] },
        ...(IS_PLATFORM
          ? [
              {
                name: 'Logs',
                key: 'auth-logs',
                url: `/project/${ref}/auth/auth-logs`,
                items: [],
              },
            ]
          : []),
      ],
    },
    ...(IS_PLATFORM
      ? [
          {
            title: 'Configuration',
            items: [
              ...(IS_PLATFORM
                ? [
                    {
                      name: 'Settings',
                      key: 'settings',
                      url: `/project/${ref}/auth/settings`,
                      items: [],
                    },
                  ]
                : []),
              {
                name: 'Email Templates',
                key: 'templates',
                url: `/project/${ref}/auth/templates`,
                items: [],
              },
            ],
          },
        ]
      : []),
  ]
}

import { IS_PLATFORM } from 'lib/constants'
import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'

export const generateAuthMenu = (ref: string): ProductMenuGroup[] => {
  return [
    {
      title: 'Users (?)',
      items: [{ name: 'Users', key: 'users', url: `/project/${ref}/auth/users`, items: [] }],
    },
    ...(IS_PLATFORM
      ? [
          {
            title: 'Configuration',
            items: [
              ...(IS_PLATFORM
                ? [
                    {
                      name: 'Settings or General?',
                      key: 'settings',
                      url: `/project/${ref}/auth/settings`,
                      items: [],
                    },
                  ]
                : []),

              {
                name: 'Policies',
                key: 'policies',
                url: `/project/${ref}/auth/policies`,
                items: [],
              },
              {
                name: 'Providers?',
                key: 'policies',
                url: `/project/${ref}/auth/policies`,
                items: [],
              },
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

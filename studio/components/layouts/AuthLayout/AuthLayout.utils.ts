import { IS_PLATFORM } from 'lib/constants'
import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'

export const generateAuthMenu = (ref: string): ProductMenuGroup[] => {
  if (IS_PLATFORM) {
    return [
      {
        title: 'General',
        items: [
          { name: 'Users', key: 'users', url: `/project/${ref}/auth/users`, items: [] },
          { name: 'Policies', key: 'policies', url: `/project/${ref}/auth/policies`, items: [] },
          { name: 'Templates', key: 'templates', url: `/project/${ref}/auth/templates`, items: [] },
        ],
      },
      {
        title: 'Configuration',
        items: [
          { name: 'Settings', key: 'settings', url: `/project/${ref}/auth/settings`, items: [] },
        ],
      },
    ]
  }

  return [
    {
      title: 'General',
      items: [
        { name: 'Policies', key: 'policies', url: `/project/${ref}/auth/policies`, items: [] },
      ],
    },
  ]
}

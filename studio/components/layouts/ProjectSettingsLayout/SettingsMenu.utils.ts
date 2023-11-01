import { Organization, ProjectBase } from 'types'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'

export const generateSettingsMenu = (
  ref?: string,
  project?: ProjectBase,
  organization?: Organization,
  features?: {
    auth?: boolean
    edgeFunctions?: boolean
    storage?: boolean
    invoices?: boolean
  }
): ProductMenuGroup[] => {
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/project/${ref}/building`

  const authEnabled = features?.auth ?? true
  const edgeFunctionsEnabled = features?.edgeFunctions ?? true
  const storageEnabled = features?.storage ?? true

  return [
    {
      title: 'Project Settings',
      items: [
        {
          name: 'General',
          key: 'general',
          url: `/project/${ref}/settings/general`,
          items: [],
        },
        {
          name: 'Infrastructure',
          key: 'infrastructure',
          url: isProjectBuilding ? buildingUrl : `/project/${ref}/settings/infrastructure`,
          items: [],
        },
        ...(IS_PLATFORM
          ? [
              {
                name: 'Integrations',
                key: 'integrations',
                url: `/project/${ref}/settings/integrations`,
                items: [],
              },
            ]
          : []),
        ...[
          {
            name: 'Add Ons',
            key: 'addons',
            url: `/project/${ref}/settings/addons`,
            items: [],
          },
        ],
        {
          name: 'Vault',
          key: 'vault',
          url: isProjectBuilding ? buildingUrl : `/project/${ref}/settings/vault/secrets`,
          items: [],
          label: 'BETA',
        },
      ],
    },
    {
      title: '',
      items: [
        {
          name: 'Database',
          key: 'database',
          url: isProjectBuilding ? buildingUrl : `/project/${ref}/settings/database`,
          items: [],
        },
        {
          name: 'API',
          key: 'api',
          url: isProjectBuilding ? buildingUrl : `/project/${ref}/settings/api`,
          items: [],
        },
        ...(IS_PLATFORM && authEnabled
          ? [
              {
                name: 'Authentication',
                key: 'auth',
                url: isProjectBuilding ? buildingUrl : `/project/${ref}/settings/auth`,
                items: [],
              },
            ]
          : []),
        ...(IS_PLATFORM && storageEnabled
          ? [
              {
                name: 'Storage',
                key: 'storage',
                url: `/project/${ref}/settings/storage`,
                items: [],
              },
            ]
          : []),
        ...(IS_PLATFORM && edgeFunctionsEnabled
          ? [
              {
                name: 'Edge Functions',
                key: 'functions',
                url: `/project/${ref}/settings/functions`,
                items: [],
              },
            ]
          : []),
      ],
    },

    {
      title: 'Billing',
      items: [
        {
          name: 'Subscription',
          key: 'subscription',
          url: `/org/${organization?.slug}/billing`,
          items: [],
        },

        {
          name: 'Usage',
          key: 'usage',
          url: `/org/${organization?.slug}/usage?projectRef=${ref}`,
          items: [],
        },
      ],
    },
  ]
}

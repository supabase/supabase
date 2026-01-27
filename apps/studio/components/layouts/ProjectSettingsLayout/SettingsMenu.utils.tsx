import { ArrowUpRight } from 'lucide-react'

import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import type { Organization } from 'types'

export const generateSettingsMenu = (
  ref?: string,
  project?: Project,
  organization?: Organization,
  features?: {
    auth?: boolean
    authProviders?: boolean
    edgeFunctions?: boolean
    storage?: boolean
    invoices?: boolean
    logDrains?: boolean
    billing?: boolean
  }
): ProductMenuGroup[] => {
  if (!IS_PLATFORM) {
    return [
      {
        title: 'Project Settings',
        items: [
          {
            name: `Log Drains`,
            key: `log-drains`,
            url: `/project/${ref}/settings/log-drains`,
            items: [],
          },
        ],
      },
    ]
  }
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/project/${ref}`

  const authEnabled = features?.auth ?? true
  const authProvidersEnabled = features?.authProviders ?? true
  const edgeFunctionsEnabled = features?.edgeFunctions ?? true
  const storageEnabled = features?.storage ?? true
  const billingEnabled = features?.billing ?? true

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
          name: 'Compute and Disk',
          key: 'compute-and-disk',
          url: `/project/${ref}/settings/compute-and-disk`,
          items: [],
        },
        {
          name: 'Infrastructure',
          key: 'infrastructure',
          url: isProjectBuilding ? buildingUrl : `/project/${ref}/settings/infrastructure`,
          items: [],
        },

        {
          name: 'Integrations',
          key: 'integrations',
          url: `/project/${ref}/settings/integrations`,
          items: [],
        },

        {
          name: 'Data API',
          key: 'api',
          url: isProjectBuilding ? buildingUrl : `/project/${ref}/settings/api`,
          items: [],
        },
        {
          name: 'API Keys',
          key: 'api-keys',
          url: `/project/${ref}/settings/api-keys/new`,
          items: [],
        },
        {
          name: `Log Drains`,
          key: `log-drains`,
          url: `/project/${ref}/settings/log-drains`,
          items: [],
        },
        {
          name: 'Add Ons',
          key: 'addons',
          url: `/project/${ref}/settings/addons`,
          items: [],
        },
        {
          name: 'Vault',
          key: 'vault',
          url: isProjectBuilding ? buildingUrl : `/project/${ref}/integrations/vault/overview`,
          items: [],
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          label: 'Beta',
        },
      ],
    },
    {
      title: 'Billing',
      items: [
        ...(billingEnabled
          ? [
              {
                name: 'Subscription',
                key: 'subscription',
                url: `/org/${organization?.slug}/billing`,
                items: [],
                rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
              },
            ]
          : []),
        {
          name: 'Usage',
          key: 'usage',
          url: `/org/${organization?.slug}/usage?projectRef=${ref}`,
          items: [],
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
        },
      ],
    },
  ]
}

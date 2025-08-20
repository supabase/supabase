import { ArrowUpRight } from 'lucide-react'

import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import type { Organization } from 'types'

export const generateSettingsMenu = (
  slug: string,
  ref?: string,
  project?: Project,
  organization?: Organization,
  features?: {
    auth?: boolean
    edgeFunctions?: boolean
    storage?: boolean
    invoices?: boolean
  }
): ProductMenuGroup[] => {
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/org/${slug}/project/${ref}`

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
          url: `/org/${slug}/project/${ref}/settings/general`,
          items: [],
        },
        ...(IS_PLATFORM
          ? [
              {
                name: 'Compute and Disk',
                key: 'compute-and-disk',
                url: `/org/${slug}/project/${ref}/settings/compute-and-disk`,
                items: [],
              },
            ]
          : []),
        {
          name: 'Infrastructure',
          key: 'infrastructure',
          url: isProjectBuilding ? buildingUrl : `/org/${slug}/project/${ref}/settings/infrastructure`,
          items: [],
        },
        ...(!IS_PLATFORM
          ? [
              {
                name: 'Integrations',
                key: 'integrations',
                url: `/org/${slug}/project/${ref}/settings/integrations`,
                items: [],
              },
              {
                name: `Log Drains`,
                key: `log-drains`,
                url: `/project/${ref}/settings/log-drains`,
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
                url: `/org/${slug}/project/${ref}/settings/api-keys`,
                items: [],
                label: 'NEW',
              },
              {
                name: 'JWT Keys',
                key: 'jwt',
                url: `/org/${slug}/project/${ref}/settings/jwt`,
                items: [],
                label: 'NEW',
              },
            ]
          : []),
        {
          name: 'Add Ons',
          key: 'addons',
          url: `/org/${slug}/project/${ref}/settings/addons`,
          items: [],
        },
        {
          name: 'Vault',
          key: 'vault',
          url: isProjectBuilding ? buildingUrl : `/org/${slug}/project/${ref}/integrations/vault/overview`,
          items: [],
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          label: 'Alpha',
        },
      ],
    },
    {
      title: 'Configuration',
      items: [
        {
          name: 'Database',
          key: 'database',
          url: isProjectBuilding ? buildingUrl : `/org/${slug}/project/${ref}/database/settings`,
          items: [],
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
        },
        ...(IS_PLATFORM && authEnabled
          ? [
              {
                name: 'Authentication',
                key: 'auth',
                url: isProjectBuilding ? buildingUrl : `/org/${slug}/project/${ref}/settings/auth`,
                items: [],
              },
            ]
          : []),
        ...(IS_PLATFORM && storageEnabled
          ? [
              {
                name: 'Storage',
                key: 'storage',
                url: `/org/${slug}/project/${ref}/storage/settings`,
                items: [],
                rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
              },
            ]
          : []),
        ...(IS_PLATFORM && edgeFunctionsEnabled
          ? [
              {
                name: 'Edge Functions',
                key: 'functions',
                url: `/org/${slug}/project/${ref}/functions/secrets`,
                items: [],
                rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
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
          url: `/org/${slug}/org/${organization?.slug}/billing`,
          items: [],
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
        },

        {
          name: 'Usage',
          key: 'usage',
          url: `/org/${slug}/org/${organization?.slug}/usage?projectRef=${ref}`,
          items: [],
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
        },
      ],
    },
  ]
}

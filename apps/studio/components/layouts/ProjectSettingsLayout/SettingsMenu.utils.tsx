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
    legacyJwtKeys?: boolean
    logDrains?: boolean
    billing?: boolean
  }
): ProductMenuGroup[] => {
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/project/${ref}`

  const authEnabled = features?.auth ?? true
  const authProvidersEnabled = features?.authProviders ?? true
  const edgeFunctionsEnabled = features?.edgeFunctions ?? true
  const storageEnabled = features?.storage ?? true
  const legacyJwtKeysEnabled = features?.legacyJwtKeys ?? true
  const logDrainsEnabled = features?.logDrains ?? true
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
        ...(IS_PLATFORM
          ? [
              {
                name: 'Compute and Disk',
                key: 'compute-and-disk',
                url: `/project/${ref}/settings/compute-and-disk`,
                items: [],
              },
            ]
          : []),
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
              ...(logDrainsEnabled
                ? [
                    {
                      name: `Log Drains`,
                      key: `log-drains`,
                      url: `/project/${ref}/settings/log-drains`,
                      items: [],
                    },
                  ]
                : []),
              {
                name: 'Data API',
                key: 'api',
                url: isProjectBuilding ? buildingUrl : `/project/${ref}/settings/api`,
                items: [],
              },
              {
                name: 'API Keys',
                key: 'api-keys',
                url: `/project/${ref}/settings/api-keys`,
                items: [],
                label: 'NEW',
              },
              {
                name: 'JWT Keys',
                key: 'jwt',
                url: legacyJwtKeysEnabled
                  ? `/project/${ref}/settings/jwt`
                  : `/project/${ref}/settings/jwt/signing-keys`,
                items: [],
                label: 'NEW',
              },
            ]
          : []),
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
          label: 'ALPHA',
        },
      ],
    },
    {
      title: 'Configuration',
      items: [
        {
          name: 'Database',
          key: 'database',
          url: isProjectBuilding ? buildingUrl : `/project/${ref}/database/settings`,
          items: [],
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
        },
        ...(IS_PLATFORM && authEnabled
          ? [
              {
                name: 'Authentication',
                key: 'auth',
                url: authProvidersEnabled
                  ? `/project/${ref}/auth/providers`
                  : `/project/${ref}/auth/policies`,
                items: [],
                rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
              },
            ]
          : []),
        ...(IS_PLATFORM && storageEnabled
          ? [
              {
                name: 'Storage',
                key: 'storage',
                url: `/project/${ref}/storage/settings`,
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
                url: `/project/${ref}/functions/secrets`,
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

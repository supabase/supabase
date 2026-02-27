import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { ArrowUpRight } from 'lucide-react'
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

  const isProjectActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  const legacyJwtKeysEnabled = features?.legacyJwtKeys ?? true
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
          disabled: !isProjectActive,
        },
        {
          name: 'Infrastructure',
          key: 'infrastructure',
          url: `/project/${ref}/settings/infrastructure`,
          items: [],
          disabled: !isProjectActive,
        },

        {
          name: 'Integrations',
          key: 'integrations',
          url: `/project/${ref}/settings/integrations`,
          items: [],
          disabled: !isProjectActive,
        },

        {
          name: 'API Keys',
          key: 'api-keys',
          url: `/project/${ref}/settings/api-keys/new`,
          items: [],
          disabled: !isProjectActive,
        },
        {
          name: 'JWT Keys',
          key: 'jwt',
          url: legacyJwtKeysEnabled
            ? `/project/${ref}/settings/jwt`
            : `/project/${ref}/settings/jwt/signing-keys`,
          items: [],
          disabled: !isProjectActive,
        },

        {
          name: `Log Drains`,
          key: `log-drains`,
          url: `/project/${ref}/settings/log-drains`,
          items: [],
          disabled: !isProjectActive,
        },
        {
          name: 'Add Ons',
          key: 'addons',
          url: `/project/${ref}/settings/addons`,
          items: [],
        },
      ],
    },
    {
      title: 'Configuration',
      items: [
        {
          name: 'Data API',
          key: 'api',
          url: `/project/${ref}/integrations/data_api/overview`,
          items: [],
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          disabled: !isProjectActive,
        },
        {
          name: 'Vault',
          key: 'vault',
          url: `/project/${ref}/integrations/vault/overview`,
          items: [],
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          label: 'Beta',
          disabled: !isProjectActive,
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

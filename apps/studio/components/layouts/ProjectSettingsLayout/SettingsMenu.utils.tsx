import { useFlag, useParams } from 'common'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { ArrowUpRight } from 'lucide-react'

import { useIsPlatformWebhooksEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export const useGenerateSettingsMenu = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()

  const showDashboardPreferences = useFlag('dashboardPreferences')
  const platformWebhooksEnabled = useIsPlatformWebhooksEnabled()

  const { projectSettingsLegacyJwtKeys: legacyJwtKeysEnabled, billingAll: billingEnabled } =
    useIsFeatureEnabled(['project_settings:legacy_jwt_keys', 'billing:all'])

  const isProjectActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  if (!IS_PLATFORM) {
    return [
      {
        title: 'Configuration',
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

  return [
    {
      title: 'Configuration',
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
        ...(platformWebhooksEnabled
          ? [
              {
                name: 'Webhooks',
                key: 'webhooks',
                url: `/project/${ref}/settings/webhooks`,
                items: [],
                disabled: !isProjectActive,
              },
            ]
          : []),

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
    ...(IS_PLATFORM && showDashboardPreferences
      ? [
          {
            title: 'Preferences',
            items: [
              {
                name: 'Dashboard preferences',
                key: 'preferences',
                url: `/project/${ref}/settings/preferences`,
                items: [],
              },
            ],
          },
        ]
      : []),
    {
      title: 'Integrations',
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

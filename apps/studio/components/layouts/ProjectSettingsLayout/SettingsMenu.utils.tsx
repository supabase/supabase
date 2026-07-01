import { useFlag, useParams } from 'common'
import { ArrowUpRight } from 'lucide-react'

import { useIsPlatformWebhooksEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { IS_PLATFORM, PROJECT_STATUS } from '@/lib/constants'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

export const useGenerateSettingsMenu = () => {
  const { ref } = useParams()
  const { data: project, isPending } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const showDashboardPreferences = useFlag('dashboardPreferences')

  const platformWebhooksEnabled = useIsPlatformWebhooksEnabled()

  const {
    projectSettingsLegacyJwtKeys: legacyJwtKeysEnabled,
    billingAll: billingEnabled,
    logsAll,
    projectSettingsLogDrains,
  } = useIsFeatureEnabled([
    'project_settings:legacy_jwt_keys',
    'billing:all',
    'logs:all',
    'project_settings:log_drains',
  ])

  // Log drains rely on the analytics backend (gated by logs:all) and on the dedicated
  // log_drains flag. Keep this in sync with ProjectSettings.Commands.tsx.
  const showLogDrains = logsAll && projectSettingsLogDrains

  const isProjectActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  if (!IS_PLATFORM) {
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
            name: 'API Keys',
            key: 'api-keys',
            url: `/project/${ref}/settings/api-keys`,
            items: [],
          },
          {
            name: 'JWT Keys',
            key: 'jwt',
            url: legacyJwtKeysEnabled
              ? `/project/${ref}/settings/jwt`
              : `/project/${ref}/settings/jwt/signing-keys`,
            items: [],
          },
          ...(showLogDrains
            ? [
                {
                  name: `Log Drains`,
                  key: `log-drains`,
                  url: `/project/${ref}/settings/log-drains`,
                  items: [],
                  shortcutId: SHORTCUT_IDS.NAV_PROJECT_SETTINGS_LOG_DRAINS,
                },
              ]
            : []),
        ],
      },
      {
        title: 'Integrations',
        items: [
          {
            name: 'Data API',
            key: 'api',
            url: `/project/${ref}/integrations/data_api/overview`,
            items: [],
            rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          },
          {
            name: 'Vault',
            key: 'vault',
            url: `/project/${ref}/integrations/vault/overview`,
            items: [],
            rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
            label: 'Beta',
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
          shortcutId: SHORTCUT_IDS.NAV_PROJECT_SETTINGS_GENERAL,
        },
        {
          name: 'Compute and Disk',
          key: 'compute-and-disk',
          url: `/project/${ref}/settings/compute-and-disk`,
          items: [],
          disabled: !isProjectActive,
          isLoading: isPending,
          shortcutId: SHORTCUT_IDS.NAV_PROJECT_SETTINGS_COMPUTE_AND_DISK,
        },
        {
          name: 'Infrastructure',
          key: 'infrastructure',
          url: `/project/${ref}/settings/infrastructure`,
          items: [],
          disabled: !isProjectActive,
          isLoading: isPending,
          shortcutId: SHORTCUT_IDS.NAV_PROJECT_SETTINGS_INFRASTRUCTURE,
        },

        {
          name: 'Integrations',
          key: 'integrations',
          url: `/project/${ref}/settings/integrations`,
          items: [],
          disabled: !isProjectActive,
          isLoading: isPending,
          shortcutId: SHORTCUT_IDS.NAV_PROJECT_SETTINGS_INTEGRATIONS,
        },
        ...(platformWebhooksEnabled
          ? [
              {
                name: 'Webhooks',
                key: 'webhooks',
                url: `/project/${ref}/settings/webhooks`,
                items: [],
                disabled: !isProjectActive,
                isLoading: isPending,
                shortcutId: SHORTCUT_IDS.NAV_PROJECT_SETTINGS_WEBHOOKS,
              },
            ]
          : []),

        {
          name: 'API Keys',
          key: 'api-keys',
          url: `/project/${ref}/settings/api-keys`,
          items: [],
          disabled: !isProjectActive,
          isLoading: isPending,
          shortcutId: SHORTCUT_IDS.NAV_PROJECT_SETTINGS_API_KEYS,
        },
        {
          name: 'JWT Keys',
          key: 'jwt',
          url: legacyJwtKeysEnabled
            ? `/project/${ref}/settings/jwt`
            : `/project/${ref}/settings/jwt/signing-keys`,
          items: [],
          disabled: !isProjectActive,
          isLoading: isPending,
          shortcutId: SHORTCUT_IDS.NAV_PROJECT_SETTINGS_JWT_KEYS,
        },

        ...(showLogDrains
          ? [
              {
                name: `Log Drains`,
                key: `log-drains`,
                url: `/project/${ref}/settings/log-drains`,
                items: [],
                disabled: !isProjectActive,
                isLoading: isPending,
                shortcutId: SHORTCUT_IDS.NAV_PROJECT_SETTINGS_LOG_DRAINS,
              },
            ]
          : []),
        {
          name: 'Add-ons',
          key: 'addons',
          url: `/project/${ref}/settings/addons`,
          items: [],
          shortcutId: SHORTCUT_IDS.NAV_PROJECT_SETTINGS_ADDONS,
        },
        ...(showDashboardPreferences
          ? [
              {
                name: 'Dashboard',
                key: 'dashboard',
                url: `/project/${ref}/settings/dashboard`,
                items: [],
                shortcutId: SHORTCUT_IDS.NAV_PROJECT_SETTINGS_DASHBOARD,
              },
            ]
          : []),
      ],
    },
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
          isLoading: isPending,
        },
        {
          name: 'Vault',
          key: 'vault',
          url: `/project/${ref}/integrations/vault/overview`,
          items: [],
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          label: 'Beta',
          disabled: !isProjectActive,
          isLoading: isPending,
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

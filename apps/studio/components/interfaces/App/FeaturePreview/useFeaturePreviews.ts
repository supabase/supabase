import { LOCAL_STORAGE_KEYS, useFlag } from 'common'
import { useMemo } from 'react'

export type FeaturePreview = {
  key: string
  name: string
  discussionsUrl?: string
  isNew: boolean
  /** If feature flag is only relevant for the hosted platform */
  isPlatformOnly: boolean
  /** If feature flag should be enabled by default for users, if not yet toggled before */
  isDefaultOptIn: boolean
  /** Visibility in the feature preview modal (For feature flagging a feature preview) */
  enabled: boolean
  /**
   * Where to send the user after enabling, to try the feature out. Omit if the
   * feature has no single destination (e.g. a global layout change).
   */
  getRoute?: (ref?: string) => string
}

export const useFeaturePreviews = (): FeaturePreview[] => {
  const platformWebhooksEnabled = useFlag('platformWebhooks')
  const jitDbAccessEnabled = useFlag('jitDbAccess')
  const isMarketplaceEnabled = useFlag('marketplaceIntegrations')

  const unifiedLogsDefaultOptIn = useFlag('unifiedLogsDefaultOptIn')

  return useMemo(
    () =>
      [
        {
          key: LOCAL_STORAGE_KEYS.UI_PREVIEW_RLS_TESTER,
          name: 'RLS Tester',
          discussionsUrl: 'https://github.com/orgs/supabase/discussions/45233',
          enabled: true,
          isNew: true,
          isPlatformOnly: false,
          isDefaultOptIn: false,
          getRoute: (ref?: string) => `/project/${ref}/database/policies`,
        },
        {
          key: LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS,
          name: 'Updated Logs interface',
          discussionsUrl: 'https://github.com/orgs/supabase/discussions/37234',
          enabled: true,
          isNew: true,
          isPlatformOnly: true,
          isDefaultOptIn: unifiedLogsDefaultOptIn,
          getRoute: (ref?: string) => `/project/${ref}/logs`,
        },
        {
          key: LOCAL_STORAGE_KEYS.UI_PREVIEW_ADVISOR_RULES,
          name: 'Disable Advisor rules',
          discussionsUrl: undefined,
          enabled: true,
          isNew: false,
          isPlatformOnly: true,
          isDefaultOptIn: false,
          getRoute: (ref?: string) => `/project/${ref}/advisors/rules/security`,
        },

        {
          key: LOCAL_STORAGE_KEYS.UI_PREVIEW_PG_DELTA_DIFF,
          name: 'PG Delta Diff',
          discussionsUrl: undefined,
          isNew: false,
          isPlatformOnly: true,
          isDefaultOptIn: true,
          enabled: true,
        },
        {
          key: LOCAL_STORAGE_KEYS.UI_PREVIEW_PLATFORM_WEBHOOKS,
          name: 'Platform webhooks',
          discussionsUrl: undefined,
          isNew: true,
          isPlatformOnly: true,
          isDefaultOptIn: false,
          enabled: platformWebhooksEnabled,
          getRoute: (ref?: string) => `/project/${ref}/settings/webhooks`,
        },
        {
          key: LOCAL_STORAGE_KEYS.UI_PREVIEW_JIT_DB_ACCESS,
          name: 'Temporary access',
          discussionsUrl: undefined,
          isNew: true,
          isPlatformOnly: true,
          isDefaultOptIn: false,
          enabled: jitDbAccessEnabled,
          getRoute: (ref?: string) => `/project/${ref}/database/settings`,
        },
        {
          key: LOCAL_STORAGE_KEYS.UI_PREVIEW_CLS,
          name: 'Column-level privileges',
          discussionsUrl: 'https://github.com/orgs/supabase/discussions/20295',
          enabled: true,
          isNew: false,
          isPlatformOnly: false,
          isDefaultOptIn: false,
          getRoute: (ref?: string) => `/project/${ref}/database/column-privileges`,
        },
        {
          key: LOCAL_STORAGE_KEYS.UI_PREVIEW_MARKETPLACE,
          name: 'Integrations layout',
          discussionsUrl: undefined,
          enabled: isMarketplaceEnabled,
          isNew: true,
          isPlatformOnly: true,
          isDefaultOptIn: false,
          getRoute: (ref?: string) => `/project/${ref}/integrations`,
        },
      ].sort((a, b) => Number(b.isNew) - Number(a.isNew)),
    [unifiedLogsDefaultOptIn, platformWebhooksEnabled, jitDbAccessEnabled, isMarketplaceEnabled]
  )
}

import { LOCAL_STORAGE_KEYS, useFlag } from 'common'

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
}

export const useFeaturePreviews = (): FeaturePreview[] => {
  const isUnifiedLogsPreviewAvailable = useFlag('unifiedLogs')

  const pgDeltaDiffEnabled = useFlag('pgdeltaDiff')
  const showFloatingMobileToolbar = useFlag('enableFloatingMobileToolbar')
  const platformWebhooksEnabled = useFlag('platformWebhooks')
  const jitDbAccessEnabled = useFlag('jitDbAccess')

  return [
    {
      key: LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS,
      name: 'New Logs interface',
      discussionsUrl: 'https://github.com/orgs/supabase/discussions/37234',
      enabled: isUnifiedLogsPreviewAvailable,
      isNew: false,
      isPlatformOnly: true,
      isDefaultOptIn: false,
    },
    {
      key: LOCAL_STORAGE_KEYS.UI_PREVIEW_BRANCHING_2_0,
      name: 'Branching via dashboard',
      discussionsUrl: 'https://github.com/orgs/supabase/discussions/branching-2-0',
      enabled: true,
      isNew: false,
      isPlatformOnly: true,
      isDefaultOptIn: false,
    },
    {
      key: LOCAL_STORAGE_KEYS.UI_PREVIEW_ADVISOR_RULES,
      name: 'Disable Advisor rules',
      discussionsUrl: undefined,
      enabled: true,
      isNew: false,
      isPlatformOnly: true,
      isDefaultOptIn: false,
    },

    {
      key: LOCAL_STORAGE_KEYS.UI_PREVIEW_PG_DELTA_DIFF,
      name: 'PG Delta Diff',
      discussionsUrl: undefined,
      isNew: true,
      isPlatformOnly: true,
      isDefaultOptIn: true,
      enabled: pgDeltaDiffEnabled,
    },
    {
      key: LOCAL_STORAGE_KEYS.UI_PREVIEW_PLATFORM_WEBHOOKS,
      name: 'Platform webhooks',
      discussionsUrl: undefined,
      isNew: true,
      isPlatformOnly: true,
      isDefaultOptIn: false,
      enabled: platformWebhooksEnabled,
    },
    {
      key: LOCAL_STORAGE_KEYS.UI_PREVIEW_JIT_DB_ACCESS,
      name: 'JIT database access',
      discussionsUrl: undefined,
      isNew: true,
      isPlatformOnly: true,
      isDefaultOptIn: false,
      enabled: jitDbAccessEnabled,
    },
    {
      key: LOCAL_STORAGE_KEYS.UI_PREVIEW_CLS,
      name: 'Column-level privileges',
      discussionsUrl: 'https://github.com/orgs/supabase/discussions/20295',
      enabled: true,
      isNew: false,
      isPlatformOnly: false,
      isDefaultOptIn: false,
    },
    {
      key: LOCAL_STORAGE_KEYS.UI_PREVIEW_TABLE_FILTER_BAR,
      name: 'New Table Filter Bar',
      discussionsUrl: 'https://github.com/orgs/supabase/discussions/42461',
      enabled: true,
      isNew: true,
      isPlatformOnly: false,
      isDefaultOptIn: true,
    },
    {
      key: LOCAL_STORAGE_KEYS.UI_PREVIEW_FLOATING_MOBILE_TOOLBAR,
      name: 'Floating Mobile Toolbar',
      discussionsUrl: 'https://github.com/orgs/supabase/discussions/43721',
      enabled: showFloatingMobileToolbar,
      isNew: true,
      isPlatformOnly: false,
      isDefaultOptIn: true,
    },
  ].sort((a, b) => Number(b.isNew) - Number(a.isNew))
}

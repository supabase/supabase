import { LOCAL_STORAGE_KEYS, useFlag } from 'common'

type FeaturePreview = {
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
  const gitlessBranchingEnabled = useFlag('gitlessBranching')
  const advisorRulesEnabled = useFlag('advisorRules')
  const isUnifiedLogsPreviewAvailable = useFlag('unifiedLogs')
  const tableEditorNewFilterBar = useFlag('tableEditorNewFilterBar')
  const pgDeltaDiffEnabled = useFlag('pgdeltaDiff')

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
      enabled: gitlessBranchingEnabled,
      isNew: false,
      isPlatformOnly: true,
      isDefaultOptIn: false,
    },
    {
      key: LOCAL_STORAGE_KEYS.UI_PREVIEW_ADVISOR_RULES,
      name: 'Disable Advisor rules',
      discussionsUrl: undefined,
      enabled: advisorRulesEnabled,
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
      key: LOCAL_STORAGE_KEYS.UI_PREVIEW_API_SIDE_PANEL,
      name: 'Project API documentation',
      discussionsUrl: 'https://github.com/orgs/supabase/discussions/18038',
      enabled: true,
      isNew: false,
      isPlatformOnly: false,
      isDefaultOptIn: false,
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
      key: LOCAL_STORAGE_KEYS.UI_PREVIEW_QUEUE_OPERATIONS,
      name: 'Queue table operations',
      discussionsUrl: 'https://github.com/orgs/supabase/discussions/42460',
      enabled: true,
      isNew: true,
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
      isDefaultOptIn: tableEditorNewFilterBar,
    },
  ].sort((a, b) => Number(b.isNew) - Number(a.isNew))
}

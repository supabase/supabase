import { LOCAL_STORAGE_KEYS } from 'common'

export const FEATURE_PREVIEWS = [
  {
    key: LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS,
    name: 'New Logs interface',
    discussionsUrl: 'https://github.com/orgs/supabase/discussions/37234',
    isNew: true,
    isPlatformOnly: true,
  },
  {
    key: LOCAL_STORAGE_KEYS.UI_PREVIEW_BRANCHING_2_0,
    name: 'Branching via dashboard',
    discussionsUrl: 'https://github.com/orgs/supabase/discussions/branching-2-0',
    isNew: true,
    isPlatformOnly: true,
  },
  {
    key: LOCAL_STORAGE_KEYS.UI_PREVIEW_ADVISOR_RULES,
    name: 'Disable Advisor rules',
    discussionsUrl: undefined,
    isNew: true,
    isPlatformOnly: true,
  },
  {
    key: LOCAL_STORAGE_KEYS.UI_PREVIEW_API_SIDE_PANEL,
    name: 'Project API documentation',
    discussionsUrl: 'https://github.com/orgs/supabase/discussions/18038',
    isNew: false,
    isPlatformOnly: false,
  },
  {
    key: LOCAL_STORAGE_KEYS.UI_PREVIEW_CLS,
    name: 'Column-level privileges',
    discussionsUrl: 'https://github.com/orgs/supabase/discussions/20295',
    isNew: false,
    isPlatformOnly: false,
  },
  {
    key: LOCAL_STORAGE_KEYS.UI_PREVIEW_QUEUE_OPERATIONS,
    name: 'Queue table operations',
    discussionsUrl: 'https://github.com/orgs/supabase/discussions/42460',
    isNew: true,
    isPlatformOnly: false,
  },
  {
    key: LOCAL_STORAGE_KEYS.UI_PREVIEW_TABLE_FILTER_BAR,
    name: 'New Table Filter Bar',
    discussionsUrl: 'https://github.com/orgs/supabase/discussions/42461',
    isNew: true,
    isPlatformOnly: false,
  },
  {
    key: LOCAL_STORAGE_KEYS.UI_PREVIEW_SIDEBAR_TOOLBAR,
    name: 'Sidebar Toolbar',
    discussionsUrl: undefined,
    isNew: true,
    isPlatformOnly: false,
  },
] as const

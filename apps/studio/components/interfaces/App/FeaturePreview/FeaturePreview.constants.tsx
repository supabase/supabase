import { LOCAL_STORAGE_KEYS } from 'common'

export const FEATURE_PREVIEWS = [
  {
    key: LOCAL_STORAGE_KEYS.UI_PREVIEW_BRANCHING_2_0,
    name: 'Branching 2.0',
    discussionsUrl: 'https://github.com/orgs/supabase/discussions/branching-2-0',
    isNew: true,
    isPlatformOnly: true,
  },
  {
    key: LOCAL_STORAGE_KEYS.UI_PREVIEW_REALTIME_SETTINGS,
    name: 'Realtime settings',
    discussionsUrl: undefined,
    isNew: true,
    isPlatformOnly: true,
  },
  {
    key: LOCAL_STORAGE_KEYS.UI_PREVIEW_INLINE_EDITOR,
    name: 'Directly edit database entities',
    discussionsUrl: 'https://github.com/orgs/supabase/discussions/33690',
    isNew: false,
    isPlatformOnly: false,
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
] as const

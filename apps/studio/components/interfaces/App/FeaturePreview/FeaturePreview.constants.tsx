import { LOCAL_STORAGE_KEYS } from 'common'
import { APISidePanelPreview } from './APISidePanelPreview'
import { CLSPreview } from './CLSPreview'
import { InlineEditorPreview } from './InlineEditorPreview'
import { SqlEditorTabsPreview } from './SqlEditorTabs'
import { TableEditorTabsPreview } from './TableEditorTabs'

export const FEATURE_PREVIEWS = [
  {
    key: LOCAL_STORAGE_KEYS.UI_PREVIEW_INLINE_EDITOR,
    name: 'Directly edit database entities',
    content: <InlineEditorPreview />,
    discussionsUrl: 'https://github.com/orgs/supabase/discussions/33690',
    isNew: true,
    isPlatformOnly: false,
  },
  {
    key: LOCAL_STORAGE_KEYS.UI_TABLE_EDITOR_TABS,
    name: 'Table Editor Tabs',
    content: <TableEditorTabsPreview />,
    discussionsUrl: 'https://github.com/orgs/supabase/discussions/35636',
    isNew: true,
    isPlatformOnly: false,
  },
  {
    key: LOCAL_STORAGE_KEYS.UI_SQL_EDITOR_TABS,
    name: 'SQL Editor Tabs',
    content: <SqlEditorTabsPreview />,
    discussionsUrl: 'https://github.com/orgs/supabase/discussions/35636',
    isNew: true,
    isPlatformOnly: true,
  },
  {
    key: LOCAL_STORAGE_KEYS.UI_PREVIEW_API_SIDE_PANEL,
    name: 'Project API documentation',
    content: <APISidePanelPreview />,
    discussionsUrl: 'https://github.com/orgs/supabase/discussions/18038',
    isNew: false,
    isPlatformOnly: false,
  },
  {
    key: LOCAL_STORAGE_KEYS.UI_PREVIEW_CLS,
    name: 'Column-level privileges',
    content: <CLSPreview />,
    discussionsUrl: 'https://github.com/orgs/supabase/discussions/20295',
    isNew: false,
    isPlatformOnly: false,
  },
]

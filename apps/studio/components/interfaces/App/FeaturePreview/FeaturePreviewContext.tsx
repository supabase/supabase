import { noop } from 'lodash'

import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { EMPTY_OBJ } from 'lib/void'
import { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react'
import { APISidePanelPreview } from './APISidePanelPreview'
import { CLSPreview } from './CLSPreview'
import { InlineEditorPreview } from './InlineEditorPreview'
import { LayoutUpdatePreview } from './LayoutUpdatePreview'
import { SqlEditorTabsPreview } from './SqlEditorTabs'
import { TableEditorTabsPreview } from './TableEditorTabs'

export const FEATURE_PREVIEWS = [
  {
    key: LOCAL_STORAGE_KEYS.UI_NEW_LAYOUT_PREVIEW,
    name: 'Layout Update for Organizations',
    content: <LayoutUpdatePreview />,
    discussionsUrl: 'https://github.com/orgs/supabase/discussions/18038',
    isNew: false,
  },
  {
    key: LOCAL_STORAGE_KEYS.UI_PREVIEW_INLINE_EDITOR,
    name: 'Inline SQL Editor',
    content: <InlineEditorPreview />,
    discussionsUrl: 'https://github.com/orgs/supabase/discussions/33690',
    isNew: true,
  },
  {
    key: LOCAL_STORAGE_KEYS.UI_TABLE_EDITOR_TABS,
    name: 'Table Editor Tabs',
    content: <TableEditorTabsPreview />,
    isNew: true,
  },
  {
    key: LOCAL_STORAGE_KEYS.UI_SQL_EDITOR_TABS,
    name: 'SQL Editor Tabs',
    content: <SqlEditorTabsPreview />,
    isNew: true,
  },
  {
    key: LOCAL_STORAGE_KEYS.UI_PREVIEW_API_SIDE_PANEL,
    name: 'Project API documentation',
    content: <APISidePanelPreview />,
    discussionsUrl: 'https://github.com/orgs/supabase/discussions/18038',
    isNew: false,
  },
  {
    key: LOCAL_STORAGE_KEYS.UI_PREVIEW_CLS,
    name: 'Column-level privileges',
    content: <CLSPreview />,
    discussionsUrl: 'https://github.com/orgs/supabase/discussions/20295',
    isNew: false,
  },
]

type FeaturePreviewContextType = {
  flags: { [key: string]: boolean }
  onUpdateFlag: (key: string, value: boolean) => void
}

const FeaturePreviewContext = createContext<FeaturePreviewContextType>({
  flags: EMPTY_OBJ,
  onUpdateFlag: noop,
})

export const useFeaturePreviewContext = () => useContext(FeaturePreviewContext)

export const FeaturePreviewContextProvider = ({ children }: PropsWithChildren<{}>) => {
  const [flags, setFlags] = useState(() =>
    FEATURE_PREVIEWS.reduce((a, b) => {
      return { ...a, [b.key]: false }
    }, {})
  )

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFlags(
        FEATURE_PREVIEWS.reduce((a, b) => {
          return { ...a, [b.key]: localStorage.getItem(b.key) === 'true' }
        }, {})
      )
    }
  }, [])

  const value = {
    flags,
    onUpdateFlag: (key: string, value: boolean) => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value.toString())
      }
      const updatedFlags = { ...flags, [key]: value }
      setFlags(updatedFlags)
    },
  }

  return <FeaturePreviewContext.Provider value={value}>{children}</FeaturePreviewContext.Provider>
}

// Helpers

export const useIsAPIDocsSidePanelEnabled = () => {
  const { flags } = useFeaturePreviewContext()
  return flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_API_SIDE_PANEL]
}

export const useIsColumnLevelPrivilegesEnabled = () => {
  const { flags } = useFeaturePreviewContext()
  return flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_CLS]
}

export const useIsInlineEditorEnabled = () => {
  const { flags } = useFeaturePreviewContext()
  return flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_INLINE_EDITOR]
}

export const useIsTableEditorTabsEnabled = () => {
  const { flags } = useFeaturePreviewContext()
  return flags[LOCAL_STORAGE_KEYS.UI_TABLE_EDITOR_TABS]
}

export const useIsSQLEditorTabsEnabled = () => {
  const { flags } = useFeaturePreviewContext()
  return flags[LOCAL_STORAGE_KEYS.UI_SQL_EDITOR_TABS]
}

export const useNewLayout = (): boolean => {
  const { flags } = useFeaturePreviewContext()
  return flags[LOCAL_STORAGE_KEYS.UI_NEW_LAYOUT_PREVIEW]
}

import { noop } from 'lodash'
import { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react'

import { FeatureFlagContext, LOCAL_STORAGE_KEYS } from 'common'
import { useFlag } from 'hooks/ui/useFlag'
import { IS_PLATFORM } from 'lib/constants'
import { EMPTY_OBJ } from 'lib/void'
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
  const { hasLoaded } = useContext(FeatureFlagContext)
  const enableTabsInterface = useFlag('tabsInterface')

  // [Joshen] Similar logic to feature flagging previews, we can use flags to default opt in previews
  const isDefaultOptIn = (feature: (typeof FEATURE_PREVIEWS)[number]) => {
    switch (feature.key) {
      case LOCAL_STORAGE_KEYS.UI_SQL_EDITOR_TABS:
        return enableTabsInterface
      case LOCAL_STORAGE_KEYS.UI_TABLE_EDITOR_TABS:
        return enableTabsInterface
      default:
        return false
    }
  }

  const [flags, setFlags] = useState(() =>
    FEATURE_PREVIEWS.reduce((a, b) => {
      return { ...a, [b.key]: false }
    }, {})
  )

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFlags(
        FEATURE_PREVIEWS.reduce((a, b) => {
          const defaultOptIn = isDefaultOptIn(b)
          const localStorageValue = localStorage.getItem(b.key)
          return {
            ...a,
            [b.key]: !localStorageValue ? defaultOptIn : localStorageValue === 'true',
          }
        }, {})
      )
    }
  }, [hasLoaded])

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
  if (!IS_PLATFORM) return false
  return flags[LOCAL_STORAGE_KEYS.UI_SQL_EDITOR_TABS]
}

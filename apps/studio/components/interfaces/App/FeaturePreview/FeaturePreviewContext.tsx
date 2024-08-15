import { noop } from 'lodash'
import { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react'

import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { EMPTY_OBJ } from 'lib/void'

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
  const [flags, setFlags] = useState({
    [LOCAL_STORAGE_KEYS.UI_PREVIEW_NAVIGATION_LAYOUT]: false,
    [LOCAL_STORAGE_KEYS.UI_PREVIEW_API_SIDE_PANEL]: false,
    [LOCAL_STORAGE_KEYS.UI_PREVIEW_RLS_AI_ASSISTANT]: false,
    [LOCAL_STORAGE_KEYS.UI_PREVIEW_CLS]: false,
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFlags({
        [LOCAL_STORAGE_KEYS.UI_PREVIEW_NAVIGATION_LAYOUT]:
          localStorage.getItem(LOCAL_STORAGE_KEYS.UI_PREVIEW_NAVIGATION_LAYOUT) === 'true',
        [LOCAL_STORAGE_KEYS.UI_PREVIEW_API_SIDE_PANEL]:
          localStorage.getItem(LOCAL_STORAGE_KEYS.UI_PREVIEW_API_SIDE_PANEL) === 'true',
        [LOCAL_STORAGE_KEYS.UI_PREVIEW_RLS_AI_ASSISTANT]:
          localStorage.getItem(LOCAL_STORAGE_KEYS.UI_PREVIEW_RLS_AI_ASSISTANT) === 'true',
        [LOCAL_STORAGE_KEYS.UI_PREVIEW_CLS]:
          localStorage.getItem(LOCAL_STORAGE_KEYS.UI_PREVIEW_CLS) === 'true',
      })
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

export const useIsRLSAIAssistantEnabled = () => {
  const { flags } = useFeaturePreviewContext()
  return flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_RLS_AI_ASSISTANT]
}

export const useIsColumnLevelPrivilegesEnabled = () => {
  const { flags } = useFeaturePreviewContext()
  return flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_CLS]
}

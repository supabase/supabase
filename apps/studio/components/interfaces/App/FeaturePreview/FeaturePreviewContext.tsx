import { FeatureFlagContext, LOCAL_STORAGE_KEYS, useFlag } from 'common'
import { EMPTY_OBJ } from 'lib/void'
import { noop } from 'lodash'
import { useQueryState } from 'nuqs'
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { FEATURE_PREVIEWS } from './FeaturePreview.constants'

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

  // [Joshen] Similar logic to feature flagging previews, we can use flags to default opt in previews
  const isDefaultOptIn = (feature: (typeof FEATURE_PREVIEWS)[number]) => {
    switch (feature.key) {
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

export const useUnifiedLogsPreview = () => {
  const { flags, onUpdateFlag } = useFeaturePreviewContext()

  const isEnabled = flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS]

  const enable = () => onUpdateFlag(LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS, true)
  const disable = () => onUpdateFlag(LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS, false)

  return { isEnabled, enable, disable }
}

export const useIsBranching2Enabled = () => {
  const { flags } = useFeaturePreviewContext()
  return flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_BRANCHING_2_0]
}

export const useIsAdvisorRulesEnabled = () => {
  const { flags } = useFeaturePreviewContext()
  return flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_ADVISOR_RULES]
}

export const useIsQueueOperationsEnabled = () => {
  const { flags } = useFeaturePreviewContext()
  return flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_QUEUE_OPERATIONS]
}

export const useIsTableFilterBarEnabled = () => {
  const { flags } = useFeaturePreviewContext()
  return flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_TABLE_FILTER_BAR]
}

export const useFeaturePreviewModal = () => {
  const [featurePreviewModal, setFeaturePreviewModal] = useQueryState('featurePreviewModal')

  const gitlessBranchingEnabled = useFlag('gitlessBranching')
  const advisorRulesEnabled = useFlag('advisorRules')
  const isUnifiedLogsPreviewAvailable = useFlag('unifiedLogs')

  const selectedFeatureKeyFromQuery = featurePreviewModal?.trim() ?? null
  const showFeaturePreviewModal = selectedFeatureKeyFromQuery !== null

  // [Joshen] Use this if we want to feature flag previews
  const isFeaturePreviewReleasedToPublic = useCallback(
    (feature: (typeof FEATURE_PREVIEWS)[number]) => {
      switch (feature.key) {
        case 'supabase-ui-branching-2-0':
          return gitlessBranchingEnabled
        case 'supabase-ui-advisor-rules':
          return advisorRulesEnabled
        case 'supabase-ui-preview-unified-logs':
          return isUnifiedLogsPreviewAvailable
        default:
          return true
      }
    },
    [gitlessBranchingEnabled, advisorRulesEnabled, isUnifiedLogsPreviewAvailable]
  )

  const selectedFeatureKey = (
    !selectedFeatureKeyFromQuery
      ? FEATURE_PREVIEWS.filter((feature) => isFeaturePreviewReleasedToPublic(feature))[0].key
      : selectedFeatureKeyFromQuery
  ) as (typeof FEATURE_PREVIEWS)[number]['key']

  const selectFeaturePreview = useCallback(
    (featureKey: (typeof FEATURE_PREVIEWS)[number]['key']) => {
      setFeaturePreviewModal(featureKey)
    },
    [setFeaturePreviewModal]
  )

  const openFeaturePreviewModal = useCallback(() => {
    selectFeaturePreview(selectedFeatureKey)
  }, [selectFeaturePreview, selectedFeatureKey])

  const closeFeaturePreviewModal = useCallback(() => {
    setFeaturePreviewModal(null)
  }, [setFeaturePreviewModal])

  const toggleFeaturePreviewModal = useCallback(() => {
    if (showFeaturePreviewModal) {
      closeFeaturePreviewModal()
    } else {
      openFeaturePreviewModal()
    }
  }, [showFeaturePreviewModal, openFeaturePreviewModal, closeFeaturePreviewModal])

  return useMemo(
    () => ({
      showFeaturePreviewModal,
      selectedFeatureKey,
      selectFeaturePreview,
      openFeaturePreviewModal,
      closeFeaturePreviewModal,
      toggleFeaturePreviewModal,
      isFeaturePreviewReleasedToPublic,
    }),
    [
      showFeaturePreviewModal,
      selectedFeatureKey,
      selectFeaturePreview,
      openFeaturePreviewModal,
      closeFeaturePreviewModal,
      toggleFeaturePreviewModal,
      isFeaturePreviewReleasedToPublic,
    ]
  )
}

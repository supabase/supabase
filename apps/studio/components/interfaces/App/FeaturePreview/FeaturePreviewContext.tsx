import { FeatureFlagContext, LOCAL_STORAGE_KEYS, useFlag } from 'common'
import { EMPTY_OBJ } from 'lib/void'
import { noop } from 'lodash'
import { useQueryState } from 'nuqs'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

import { useFeaturePreviews } from './useFeaturePreviews'
import { useStaticEffectEvent } from '@/hooks/useStaticEffectEvent'

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
  const featurePreviews = useFeaturePreviews()

  const [flags, setFlags] = useState(() =>
    featurePreviews.reduce((a, b) => ({ ...a, [b.key]: false }), {})
  )

  const initializeFlags = useStaticEffectEvent(() => {
    setFlags(
      featurePreviews.reduce((a, b) => {
        const defaultOptIn = b.isDefaultOptIn
        const localStorageValue = localStorage.getItem(b.key)
        return {
          ...a,
          [b.key]: !localStorageValue ? defaultOptIn : localStorageValue === 'true',
        }
      }, {})
    )
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeFlags()
    }
  }, [hasLoaded, initializeFlags])

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
  const gitlessBranchingEnabled = useFlag('gitlessBranching')
  return gitlessBranchingEnabled && flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_BRANCHING_2_0]
}

export const useIsPgDeltaDiffEnabled = () => {
  const { flags } = useFeaturePreviewContext()
  const pgDeltaDiffEnabled = useFlag('pgdeltaDiff')
  return pgDeltaDiffEnabled && flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_PG_DELTA_DIFF]
}

export const useIsAdvisorRulesEnabled = () => {
  const { flags } = useFeaturePreviewContext()
  const advisorRulesEnabled = useFlag('advisorRules')
  return advisorRulesEnabled && flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_ADVISOR_RULES]
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
  const featurePreviews = useFeaturePreviews()
  const [featurePreviewModal, setFeaturePreviewModal] = useQueryState('featurePreviewModal')

  const selectedFeatureKeyFromQuery = featurePreviewModal?.trim() ?? null
  const showFeaturePreviewModal = selectedFeatureKeyFromQuery !== null

  const selectedFeatureKey = (
    !selectedFeatureKeyFromQuery ? featurePreviews[0].key : selectedFeatureKeyFromQuery
  ) as (typeof featurePreviews)[number]['key']

  const selectFeaturePreview = useCallback(
    (featureKey: (typeof featurePreviews)[number]['key']) => {
      setFeaturePreviewModal(featureKey)
    },
    [setFeaturePreviewModal]
  )

  const toggleFeaturePreviewModal = useCallback(
    (value: boolean) => {
      if (!value) {
        setFeaturePreviewModal(null)
      } else {
        selectFeaturePreview(selectedFeatureKey)
      }
    },
    [selectFeaturePreview, setFeaturePreviewModal, selectedFeatureKey]
  )

  return useMemo(
    () => ({
      showFeaturePreviewModal,
      selectedFeatureKey,
      selectFeaturePreview,
      toggleFeaturePreviewModal,
    }),
    [showFeaturePreviewModal, selectedFeatureKey, selectFeaturePreview, toggleFeaturePreviewModal]
  )
}

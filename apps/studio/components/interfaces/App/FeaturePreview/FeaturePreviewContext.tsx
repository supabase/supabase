import { FeatureFlagContext, LOCAL_STORAGE_KEYS, safeLocalStorage, useFlag } from 'common'
import { noop } from 'lodash'
import { useQueryState } from 'nuqs'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

import { useFeaturePreviews } from './useFeaturePreviews'
import { IS_PLATFORM } from '@/lib/constants'
import { EMPTY_OBJ } from '@/lib/void'

type FeaturePreviewContextType = {
  flags: { [key: string]: boolean }
  isInitialized: boolean
  onUpdateFlag: (key: string, value: boolean) => void
}

const FeaturePreviewContext = createContext<FeaturePreviewContextType>({
  flags: EMPTY_OBJ,
  isInitialized: false,
  onUpdateFlag: noop,
})

export const useFeaturePreviewContext = () => useContext(FeaturePreviewContext)

export const FeaturePreviewContextProvider = ({ children }: PropsWithChildren) => {
  const { hasLoaded } = useContext(FeatureFlagContext)
  const featurePreviews = useFeaturePreviews()

  const [flags, setFlags] = useState(() =>
    featurePreviews.reduce((a, b) => ({ ...a, [b.key]: false }), {})
  )
  // Tracks whether `flags` reflects the loaded feature flags (vs. the pre-load
  // defaults). Only set true once `initializeFlags` runs with `hasLoaded`.
  const [isInitialized, setIsInitialized] = useState(false)

  const initializeFlags = useEffectEvent(() => {
    setFlags(
      featurePreviews.reduce((a, b) => {
        // Platform-only previews can never be enabled outside the hosted platform
        if (!IS_PLATFORM && b.isPlatformOnly) {
          return { ...a, [b.key]: false }
        }

        const defaultOptIn = b.isDefaultOptIn
        const localStorageValue = safeLocalStorage.getItem(b.key)
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
      // Defer marking initialized until the underlying flags have loaded, so
      // flag-derived defaults (e.g. default opt-in) are reflected in `flags`.
      if (hasLoaded) setIsInitialized(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- useEffectEvent fn intentionally not a dep (eslint-plugin-react-hooks v5 doesn't recognize stable useEffectEvent yet)
  }, [hasLoaded])

  const value = {
    flags,
    isInitialized,
    onUpdateFlag: (key: string, value: boolean) => {
      safeLocalStorage.setItem(key, value ? 'true' : 'false')
      const updatedFlags = { ...flags, [key]: value }
      setFlags(updatedFlags)
    },
  }

  return <FeaturePreviewContext.Provider value={value}>{children}</FeaturePreviewContext.Provider>
}

// Helpers

export const useIsColumnLevelPrivilegesEnabled = () => {
  const { flags } = useFeaturePreviewContext()
  return flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_CLS]
}

export const useUnifiedLogsPreview = () => {
  const unifiedLogsDefaultOptIn = useFlag('unifiedLogsDefaultOptIn')
  const { flags, isInitialized, onUpdateFlag } = useFeaturePreviewContext()

  const isLoading = !isInitialized
  const isEnabled = flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS]

  const hasToggledPreview = !!safeLocalStorage.getItem(LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS)
  const isDefaultOptIn = isInitialized && unifiedLogsDefaultOptIn && !hasToggledPreview

  const enable = () => onUpdateFlag(LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS, true)
  const disable = () => onUpdateFlag(LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS, false)

  return { isEnabled, isLoading, isDefaultOptIn, enable, disable }
}

export const useIsPgDeltaDiffEnabled = () => {
  const { flags } = useFeaturePreviewContext()
  return flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_PG_DELTA_DIFF]
}

export const useIsAdvisorRulesEnabled = () => {
  const { flags } = useFeaturePreviewContext()
  return flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_ADVISOR_RULES]
}

export const useIsPlatformWebhooksEnabled = () => {
  const { flags } = useFeaturePreviewContext()
  const platformWebhooksEnabled = useFlag('platformWebhooks')
  return platformWebhooksEnabled && flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_PLATFORM_WEBHOOKS]
}

export const useIsJitDbAccessEnabled = () => {
  const { flags } = useFeaturePreviewContext()
  const jitDbAccessEnabled = useFlag('jitDbAccess')
  return jitDbAccessEnabled && flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_JIT_DB_ACCESS]
}

export const useIsSqlEditorManualSaveEnabled = () => {
  const { flags } = useFeaturePreviewContext()
  const sqlEditorManualSaveEnabled = useFlag('sqlEditorManualSave')
  return sqlEditorManualSaveEnabled && flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_SQL_EDITOR_MANUAL_SAVE]
}

export const useIsMarketplaceEnabled = () => {
  const { flags } = useFeaturePreviewContext()
  const isMarketplaceEnabled = useFlag('marketplaceIntegrations')
  return isMarketplaceEnabled && flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_MARKETPLACE]
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

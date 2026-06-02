import { FeatureFlagContext, LOCAL_STORAGE_KEYS, useFlag } from 'common'
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
import { EMPTY_OBJ } from '@/lib/void'

type FeaturePreviewContextType = {
  flags: { [key: string]: boolean }
  onUpdateFlag: (key: string, value: boolean) => void
}

const FeaturePreviewContext = createContext<FeaturePreviewContextType>({
  flags: EMPTY_OBJ,
  onUpdateFlag: noop,
})

export const useFeaturePreviewContext = () => useContext(FeaturePreviewContext)

export const FeaturePreviewContextProvider = ({ children }: PropsWithChildren) => {
  const { hasLoaded } = useContext(FeatureFlagContext)
  const featurePreviews = useFeaturePreviews()

  const [flags, setFlags] = useState(() =>
    featurePreviews.reduce((a, b) => ({ ...a, [b.key]: false }), {})
  )

  const initializeFlags = useEffectEvent(() => {
    setFlags(
      featurePreviews.reduce((a, b) => {
        const defaultOptIn = b.isDefaultOptIn
        try {
          const localStorageValue = window.localStorage.getItem(b.key)
          return {
            ...a,
            [b.key]: !localStorageValue ? defaultOptIn : localStorageValue === 'true',
          }
        } catch {
          return { ...a, [b.key]: defaultOptIn }
        }
      }, {})
    )
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeFlags()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- useEffectEvent fn intentionally not a dep (eslint-plugin-react-hooks v5 doesn't recognize stable useEffectEvent yet)
  }, [hasLoaded])

  const value = {
    flags,
    onUpdateFlag: (key: string, value: boolean) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value ? 'true' : 'false')
        }
      } catch {
        // Silently fail in restricted storage modes (e.g. Safari private browsing)
      }
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
  const { flags, onUpdateFlag } = useFeaturePreviewContext()
  const { hasLoaded: flagsHaveLoaded } = useContext(FeatureFlagContext)
  const unifiedLogsEnabled = useFlag('unifiedLogs')

  const isLoading = !flagsHaveLoaded
  const isEnabled = unifiedLogsEnabled && flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS]

  const enable = () => onUpdateFlag(LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS, true)
  const disable = () => onUpdateFlag(LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS, false)

  return { isEnabled, isEligible: unifiedLogsEnabled, isLoading, enable, disable }
}

export const useIsPgDeltaDiffEnabled = () => {
  const { flags } = useFeaturePreviewContext()
  const pgDeltaDiffEnabled = useFlag('pgdeltaDiff')
  return pgDeltaDiffEnabled && flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_PG_DELTA_DIFF]
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

export const useIsRLSTesterEnabled = () => {
  const { flags } = useFeaturePreviewContext()
  return flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_RLS_TESTER]
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

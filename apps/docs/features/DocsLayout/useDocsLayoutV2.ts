'use client'

import { useFeatureFlags } from 'common'
import { LOCAL_STORAGE_KEYS } from 'common/constants/local-storage'
import { safeLocalStorage, safeSessionStorage } from 'common/safe-storage'
import { useEffect, useSyncExternalStore } from 'react'

import { DOCS_LAYOUT_FLAG } from './constants'

const subscribeToNothing = () => () => {}

// useSearchParamsShallow reads the url only on mount, so each render reads it again here
const readOverride = () => {
  const urlOverride = new URLSearchParams(window.location.search).get(DOCS_LAYOUT_FLAG)
  // a url value other than true or false says nothing, so the session override stays
  return urlOverride === 'true' || urlOverride === 'false'
    ? urlOverride
    : safeSessionStorage.getItem(DOCS_LAYOUT_FLAG)
}

export function useDocsLayoutV2(): boolean {
  const { posthog, hasLoaded } = useFeatureFlags()
  const override = useSyncExternalStore(subscribeToNothing, readOverride, () => null)
  // the value from the last visit, so a returning reader skips the legacy layout while the flags load
  const knownFlag = useSyncExternalStore(
    subscribeToNothing,
    () => safeLocalStorage.getItem(LOCAL_STORAGE_KEYS.DOCS_LAYOUT_FLAG),
    () => null
  )

  // a failed posthog request loads no flags at all, so the last value stays
  const hasPosthogFlags = hasLoaded && Object.keys(posthog).length > 0
  const isFlagOn = hasPosthogFlags ? posthog[DOCS_LAYOUT_FLAG] === true : knownFlag === 'true'
  const isLayoutV2 = override ? override === 'true' : isFlagOn

  // exception: the flags arrive through context, with no event to hook
  useEffect(() => {
    if (!hasPosthogFlags) return
    safeLocalStorage.setItem(LOCAL_STORAGE_KEYS.DOCS_LAYOUT_FLAG, String(isFlagOn))
  }, [hasPosthogFlags, isFlagOn])

  // the html attribute drives the layout-v2 css variant, so server components can style both layouts
  useEffect(() => {
    if (override) safeSessionStorage.setItem(DOCS_LAYOUT_FLAG, override)
    if (isLayoutV2) document.documentElement.dataset.docsLayout = 'v2'
    else delete document.documentElement.dataset.docsLayout
  }, [override, isLayoutV2])

  return isLayoutV2
}

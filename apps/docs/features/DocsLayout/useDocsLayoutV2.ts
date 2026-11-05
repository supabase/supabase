'use client'

import { useFeatureFlags, useSearchParamsShallow } from 'common'
import { safeSessionStorage } from 'common/safe-storage'
import { useEffect, useSyncExternalStore } from 'react'

import { DOCS_LAYOUT_FLAG } from './constants'

const subscribeToNothing = () => () => {}

const readStoredOverride = () => safeSessionStorage.getItem(DOCS_LAYOUT_FLAG)

/**
 * Reads the `docs-layout-v2` PostHog flag. `?docs-layout-v2=true|false` overrides it for the
 * rest of the browser session. Mirrors the result on `<html data-docs-layout>`, which drives
 * the `layout-v2:` css variant, so server components can style both layouts.
 */
export function useDocsLayoutV2(): boolean {
  const { posthog } = useFeatureFlags()
  const urlParam = useSearchParamsShallow().get(DOCS_LAYOUT_FLAG)
  // a url value other than true or false says nothing, so the session override stays
  const urlOverride = urlParam === 'true' || urlParam === 'false' ? urlParam : null
  const storedOverride = useSyncExternalStore(subscribeToNothing, readStoredOverride, () => null)
  const override = urlOverride || storedOverride
  const isLayoutV2 = override ? override === 'true' : posthog[DOCS_LAYOUT_FLAG] === true

  // exception: the stored override and the html attribute live outside react
  useEffect(() => {
    if (urlOverride) safeSessionStorage.setItem(DOCS_LAYOUT_FLAG, urlOverride)
    if (isLayoutV2) document.documentElement.dataset.docsLayout = 'v2'
    else delete document.documentElement.dataset.docsLayout
  }, [urlOverride, isLayoutV2])

  return isLayoutV2
}

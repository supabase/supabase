'use client'

import { type PropsWithChildren, useEffect, useState } from 'react'
import { BUILD_PREVIEW_HTML, IS_PREVIEW, SKIP_BUILD_STATIC_GENERATION } from '~/lib/constants'

/**
 * Preview builds don't need to be statically generated to optimize performance.
 * This (somewhat hacky) way of shortcutting preview builds cuts their build
 * time and speeds up the feedback loop for previewing docs changes in Vercel.
 *
 * This technically breaks the Rules of Hooks to avoid an unnecessary full-app
 * rerender in prod, but this is fine because IS_PREVIEW will never change on
 * you within a single build.
 */
export const ShortcutPreviewBuild = ({ children }: PropsWithChildren) => {
  if (!BUILD_PREVIEW_HTML && IS_PREVIEW) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [isMounted, setIsMounted] = useState(false)

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      setIsMounted(true)
    }, [])

    return isMounted ? children : null
  }

  return children
}

'use client'

import { useEffect } from 'react'

/**
 * Scrolls to the element whose id matches the given query param, so links
 * written for an older tabbed layout (e.g. `?source=edge_logs`) still land on
 * the right section.
 */
export function QueryParamAnchor({ param }: { param: string }) {
  useEffect(() => {
    if (window.location.hash) return
    const id = new URLSearchParams(window.location.search).get(param)
    if (id) document.getElementById(id)?.scrollIntoView()
  }, [param])

  return null
}

'use client'

import { useCallback, useState } from 'react'

export type CopyMarkdownFromUrlOptions = {
  /** When the markdown URL is missing or not OK, use this HTML string instead (e.g. rendered article). */
  fallbackHtml?: () => string
}

const COPIED_FEEDBACK_MS = 2000

/**
 * Fetches markdown from `mdUrl`, falls back to optional HTML when the response is not OK,
 * then writes the result to the clipboard.
 */
export async function copyMarkdownFromUrl(
  mdUrl: string,
  options?: CopyMarkdownFromUrlOptions
): Promise<boolean> {
  try {
    const res = await fetch(mdUrl)
    let text: string
    if (res.ok) {
      text = await res.text()
    } else {
      text = options?.fallbackHtml?.() ?? ''
      if (!text) return false
    }
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy markdown', error)
    return false
  }
}

export function useCopyMarkdownFromUrl() {
  const [copied, setCopied] = useState(false)

  const copyMarkdown = useCallback(async (mdUrl: string, options?: CopyMarkdownFromUrlOptions) => {
    const ok = await copyMarkdownFromUrl(mdUrl, options)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
    }
    return ok
  }, [])

  return { copied, copyMarkdown }
}

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

import { COMPACT_LAYOUT_BREAKPOINT } from './ErrorDisplay.constants'
import type { ErrorDisplayDetails, ErrorDisplaySize, SupportFormParams } from './ErrorDisplay.types'

export function formatTimestamp(timestamp: string | Date) {
  return timestamp instanceof Date ? timestamp.toISOString() : timestamp
}

export function formatErrorDetails(error: ErrorDisplayDetails, title?: string) {
  const lines = [
    title ? `Title: ${title}` : undefined,
    `Error: ${error.message}`,
    error.code ? `Code: ${error.code}` : undefined,
    error.requestId ? `Request ID: ${error.requestId}` : undefined,
    error.timestamp ? `Timestamp: ${formatTimestamp(error.timestamp)}` : undefined,
  ]
  return lines.filter(Boolean).join('\n')
}

export function buildSupportUrl(
  params: SupportFormParams | undefined,
  error: ErrorDisplayDetails | undefined,
  title: string | undefined
) {
  const merged: SupportFormParams = {
    subject: title,
    ...params,
    error: params?.error ?? (error ? formatErrorDetails(error) : undefined),
    sid: params?.sid ?? error?.requestId,
  }

  const entries = Object.entries(merged).filter(([, value]) => value !== undefined && value !== '')
  if (entries.length === 0) return '/support/new'

  return `/support/new?${new URLSearchParams(entries as [string, string][]).toString()}`
}

export function isExternalHref(href: string) {
  return /^(https?:)?\/\//.test(href)
}

export function useContainerWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState<number | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setWidth(entry.contentRect.width || null)
    })

    observer.observe(element)
    setWidth(element.getBoundingClientRect().width || null)

    return () => observer.disconnect()
  }, [ref])

  return width
}

export function resolveSize(size: ErrorDisplaySize, width: number | null) {
  if (size !== 'auto') return size
  if (width === null) return 'full'
  return width < COMPACT_LAYOUT_BREAKPOINT ? 'compact' : 'full'
}

export function useRetry(onRetry?: () => void | Promise<void>) {
  const [isRetrying, setIsRetrying] = useState(false)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const retry = useCallback(async () => {
    if (!onRetry || isRetrying) return

    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      if (isMounted.current) setIsRetrying(false)
    }
  }, [onRetry, isRetrying])

  return { isRetrying, retry }
}

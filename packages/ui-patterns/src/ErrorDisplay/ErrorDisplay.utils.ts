import { useCallback, useEffect, useState, type RefObject } from 'react'

import { COMPACT_LAYOUT_BREAKPOINT } from './ErrorDisplay.constants'
import type { ErrorDisplayDetails, ErrorDisplaySize, SupportFormParams } from './ErrorDisplay.types'

export function formatErrorDetails(error: ErrorDisplayDetails, title?: string) {
  return [
    title && `Title: ${title}`,
    `Error: ${error.message}`,
    error.code && `Code: ${error.code}`,
    error.requestId && `Request ID: ${error.requestId}`,
    error.timestamp && `Timestamp: ${formatTimestamp(error.timestamp)}`,
  ]
    .filter(Boolean)
    .join('\n')
}

export function formatTimestamp(timestamp: string | Date) {
  return timestamp instanceof Date ? timestamp.toISOString() : timestamp
}

export function buildSupportUrl(
  params: SupportFormParams | undefined,
  error: ErrorDisplayDetails | undefined,
  title: string | undefined
) {
  const entries = Object.entries({
    subject: title,
    ...params,
    error: params?.error ?? (error && formatErrorDetails(error)),
    sid: params?.sid ?? error?.requestId,
  }).filter(([, value]) => value !== undefined && value !== '')

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

    const observer = new ResizeObserver(([entry]) => {
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
  return width !== null && width < COMPACT_LAYOUT_BREAKPOINT ? 'compact' : 'full'
}

export function useRetry(onRetry?: () => void | Promise<void>) {
  const [isRetrying, setIsRetrying] = useState(false)

  const retry = useCallback(async () => {
    if (!onRetry || isRetrying) return
    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }, [onRetry, isRetrying])

  return { isRetrying, retry }
}

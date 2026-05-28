'use client'

import { useCallback, useEffect, useState, type MouseEvent as ReactMouseEvent } from 'react'
import {
  DOCS_AI_SIDEBAR_WIDTH_MAX_PX,
  DOCS_AI_SIDEBAR_WIDTH_MIN_PX,
  DOCS_AI_SIDEBAR_WIDTH_STORAGE_KEY,
  getDefaultSidebarWidth,
} from './types'

function readStoredWidth(fallback: number) {
  if (typeof window === 'undefined') return fallback

  const stored = window.localStorage.getItem(DOCS_AI_SIDEBAR_WIDTH_STORAGE_KEY)
  if (!stored) return fallback

  const parsed = Number.parseInt(stored, 10)
  if (Number.isNaN(parsed)) return fallback

  return Math.min(Math.max(parsed, DOCS_AI_SIDEBAR_WIDTH_MIN_PX), DOCS_AI_SIDEBAR_WIDTH_MAX_PX)
}

function useSidebarResize(initialWidth: number) {
  const [sidebarWidth, setSidebarWidth] = useState(initialWidth)
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    window.localStorage.setItem(DOCS_AI_SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidth))
  }, [sidebarWidth])

  const startResize = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault()

      const startX = event.clientX
      const startWidth = sidebarWidth
      setIsResizing(true)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
        const nextWidth = Math.min(
          Math.max(startWidth + (startX - moveEvent.clientX), DOCS_AI_SIDEBAR_WIDTH_MIN_PX),
          DOCS_AI_SIDEBAR_WIDTH_MAX_PX
        )
        setSidebarWidth(nextWidth)
      }

      const handleMouseUp = () => {
        setIsResizing(false)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    },
    [sidebarWidth]
  )

  return { sidebarWidth, setSidebarWidth, startResize, isResizing }
}

function useInitialSidebarWidth() {
  const [initialWidth] = useState(() =>
    readStoredWidth(getDefaultSidebarWidth(typeof window !== 'undefined' ? window.innerWidth : 1280))
  )

  return initialWidth
}

export { useInitialSidebarWidth, useSidebarResize }

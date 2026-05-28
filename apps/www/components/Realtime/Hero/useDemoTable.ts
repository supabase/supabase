'use client'

import { useCallback, useRef, useState } from 'react'

import { cellKey } from './demoGridContext'
import { createCursorStore, type CursorStore } from './cursorStore'
import { MOCK_USER_ROWS, type UserRow } from './mockUserTableData'
import type { CellFocusPayload, CursorPayload } from './types'

export function useDemoTable() {
  const [rows] = useState<UserRow[]>(() => MOCK_USER_ROWS.map((row) => ({ ...row })))
  const [focusedCells, setFocusedCells] = useState<Record<string, CellFocusPayload>>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const cursorStoreRef = useRef<CursorStore | null>(null)

  if (!cursorStoreRef.current) {
    cursorStoreRef.current = createCursorStore()
  }

  const cursorStore = cursorStoreRef.current

  const setUserCursor = useCallback(
    (userId: string, name: string, color: string, x: number, y: number) => {
      const payload: CursorPayload = {
        position: { x, y },
        user: { id: userId, name },
        color,
        timestamp: Date.now(),
      }
      cursorStore.setCursor(userId, payload)
    },
    [cursorStore]
  )

  const setUserCellFocus = useCallback(
    (
      userId: string,
      name: string,
      color: string,
      rowId: string,
      columnKey: string,
      isFocused: boolean
    ) => {
      setFocusedCells((prev) => {
        const key = cellKey(rowId, columnKey)

        if (isFocused) {
          return {
            ...prev,
            [key]: { rowId, columnKey, userId, name, color, isFocused: true },
          }
        }

        if (prev[key]?.userId !== userId) return prev
        const next = { ...prev }
        delete next[key]
        return next
      })
    },
    []
  )

  const disconnectUser = useCallback(
    (userId: string) => {
      cursorStore.removeCursor(userId)
      setFocusedCells((prev) => {
        let changed = false
        const next = { ...prev }

        for (const [key, focus] of Object.entries(next)) {
          if (focus.userId === userId) {
            delete next[key]
            changed = true
          }
        }

        return changed ? next : prev
      })
    },
    [cursorStore]
  )

  return {
    rows,
    focusedCells,
    containerRef,
    cursorStore,
    setUserCursor,
    setUserCellFocus,
    disconnectUser,
  }
}

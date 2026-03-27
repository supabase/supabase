'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Button, cn } from 'ui'
import type { PaginationState } from './types'

const PAGE_SIZE_OPTIONS = [25, 50, 100, 500]

interface DataTablePaginationProps {
  pagination: PaginationState
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
}

export function DataTablePagination({
  pagination,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  const { page, pageSize, total } = pagination
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const [inputVal, setInputVal] = useState<string>('')
  const [editing, setEditing] = useState(false)

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const goToPage = (p: number) => {
    const clamped = Math.max(1, Math.min(totalPages, p))
    onPageChange(clamped)
  }

  const handlePageInput = () => {
    const parsed = parseInt(inputVal, 10)
    if (!Number.isNaN(parsed)) goToPage(parsed)
    setEditing(false)
    setInputVal('')
  }

  return (
    <div className="flex h-9 shrink-0 items-center justify-between border-t border-border px-2 text-xs text-foreground-light">
      {/* Total count */}
      <span>{total > 0 ? `${from}–${to} of ${total.toLocaleString()} records` : '0 records'}</span>

      <div className="flex items-center gap-2">
        {/* Page size selector */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1">
            <span className="text-foreground-lighter">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className={cn(
                'h-6 rounded border border-control bg-surface-100 px-1 text-xs text-foreground',
                'focus:outline-none focus:ring-1 focus:ring-brand'
              )}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Prev */}
        <Button
          type="text"
          size="tiny"
          className="h-6 w-6 p-0"
          disabled={page <= 1}
          onClick={() => goToPage(page - 1)}
          icon={<ChevronLeft className="h-3.5 w-3.5" />}
        />

        {/* Page input */}
        <div className="flex items-center gap-1">
          {editing ? (
            <input
              autoFocus
              type="number"
              min={1}
              max={totalPages}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onBlur={handlePageInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePageInput()
                if (e.key === 'Escape') {
                  setEditing(false)
                  setInputVal('')
                }
              }}
              className={cn(
                'h-6 w-12 rounded border border-brand bg-surface-100 px-1 text-center text-xs text-foreground',
                'focus:outline-none focus:ring-1 focus:ring-brand'
              )}
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setInputVal(String(page))
                setEditing(true)
              }}
              className="rounded px-1.5 py-0.5 text-xs hover:bg-surface-300"
            >
              {page}
            </button>
          )}
          <span className="text-foreground-lighter">/ {totalPages}</span>
        </div>

        {/* Next */}
        <Button
          type="text"
          size="tiny"
          className="h-6 w-6 p-0"
          disabled={page >= totalPages}
          onClick={() => goToPage(page + 1)}
          icon={<ChevronRight className="h-3.5 w-3.5" />}
        />
      </div>
    </div>
  )
}

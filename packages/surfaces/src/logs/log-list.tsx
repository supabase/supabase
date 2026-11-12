import { useRef, type KeyboardEvent } from 'react'
import { cn } from 'ui'

import { formatLogTime, type LogEntry, type LogLevelLabel } from './logs-model'

export type SelectModifiers = { shift?: boolean; toggle?: boolean }

const LEVEL_DOT: Record<LogLevelLabel, string> = {
  ERROR: 'bg-destructive',
  WARN: 'bg-warning',
  INFO: 'bg-foreground-lighter',
}

interface LogListProps {
  logs: LogEntry[]
  selectedIds: string[]
  focusId: string | null
  isLoading: boolean
  emptyMessage: string
  onSelect: (id: string, modifiers?: SelectModifiers) => void
  onSelectAll: (anchorId: string) => void
  onClear: () => void
  onFocusRow: (id: string) => void
}

export function LogList({
  logs,
  selectedIds,
  focusId,
  isLoading,
  emptyMessage,
  onSelect,
  onSelectAll,
  onClear,
  onFocusRow,
}: LogListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const hasFocusedRow = logs.some((log) => log.id === focusId)

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const log = logs[index]
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault()
      onSelectAll(log.id)
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      onClear()
      return
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    const step = event.key === 'ArrowDown' ? 1 : -1
    const next = Math.max(0, Math.min(logs.length - 1, index + step))
    const row = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]')[next]
    row?.focus()
    row?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
    onSelect(logs[next].id, { shift: event.shiftKey })
  }

  return (
    <div
      ref={listRef}
      className="min-h-0 min-w-0 flex-1 overflow-auto p-1"
      aria-label="Log events"
      role="listbox"
      aria-multiselectable="true"
      aria-busy={isLoading}
    >
      {isLoading && (
        <p role="status" className="px-4 py-8 text-center text-sm text-foreground-light">
          Loading logs…
        </p>
      )}
      {!isLoading && logs.length === 0 && (
        <p className="px-4 py-8 text-center text-sm text-foreground-light">{emptyMessage}</p>
      )}
      {!isLoading &&
        logs.map((log, index) => {
          const isSelected = selectedIds.includes(log.id)
          const isTabStop = log.id === focusId || (!hasFocusedRow && index === 0)
          return (
            <button
              key={log.id}
              type="button"
              role="option"
              aria-selected={isSelected}
              data-level={log.level}
              tabIndex={isTabStop ? 0 : -1}
              className={cn(
                'flex h-7 w-full min-w-[580px] select-none items-center gap-2.5 rounded-sm px-2 text-left font-mono text-xs',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground-muted',
                isSelected ? 'bg-selection' : 'hover:bg-surface-200'
              )}
              onFocus={() => onFocusRow(log.id)}
              onClick={(event) =>
                onSelect(log.id, { shift: event.shiftKey, toggle: event.metaKey || event.ctrlKey })
              }
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              <span
                aria-hidden="true"
                className={cn('h-1.5 w-1.5 shrink-0 rounded-full', LEVEL_DOT[log.level])}
              />
              <time title={log.time} className="w-16 shrink-0 tabular-nums text-foreground-light">
                {formatLogTime(log.time)}
              </time>
              <span className="w-24 shrink-0 truncate text-foreground-light">{log.source}</span>
              {log.method && <span className="shrink-0 text-foreground-lighter">{log.method}</span>}
              {log.status && (
                <span
                  className={cn(
                    'shrink-0 tabular-nums',
                    log.level === 'ERROR' && 'text-destructive',
                    log.level === 'WARN' && 'text-warning',
                    log.level === 'INFO' && 'text-foreground-light'
                  )}
                >
                  {log.status}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-foreground">{log.message}</span>
            </button>
          )
        })}
    </div>
  )
}

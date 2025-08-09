import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { useCallback, useMemo, useEffect } from 'react'
import { useDataTable } from 'components/ui/DataTable/providers/DataTableProvider'
import { DataTableColumnStatusCode } from 'components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'
import { LogTypeIcon } from '../../components/LogTypeIcon'
import { getStatusLevel } from '../../UnifiedLogs.utils'
import { TruncatedTextWithPopover } from './shared/TruncatedTextWithPopover'
import { Badge, Button, Separator } from 'ui'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { Kbd } from 'components/ui/DataTable/primitives/Kbd'
import { ColumnSchema } from '../../UnifiedLogs.schema'

interface ServiceFlowHeaderProps {
  selectedRow: ColumnSchema
  enrichedData?: Record<string, any>
}

export const ServiceFlowHeader = ({ selectedRow, enrichedData }: ServiceFlowHeaderProps) => {
  const { table, rowSelection, isLoading } = useDataTable()

  const method = selectedRow?.method
  const logType = selectedRow?.log_type
  const status = selectedRow?.status

  // Display logic: path → event_message → grayed out "/"
  const displayPath = useMemo(() => {
    const actualPath = enrichedData?.request_path || selectedRow?.pathname
    if (actualPath && actualPath !== '/') {
      return { text: actualPath, isDefault: false, isTruncatable: false }
    }

    const eventMessage = enrichedData?.event_message || selectedRow?.event_message
    if (eventMessage) {
      return { text: eventMessage, isDefault: false, isTruncatable: true }
    }

    return { text: '/', isDefault: true, isTruncatable: false }
  }, [enrichedData, selectedRow])

  // Navigation logic (same as DataTableSheetDetails)
  const selectedRowKey = Object.keys(rowSelection)?.[0]

  const selectedRowData = useMemo(() => {
    if (isLoading && !selectedRowKey) return
    return table.getCoreRowModel().flatRows.find((row) => row.id === selectedRowKey)
  }, [selectedRowKey, isLoading, table])

  const index = table.getCoreRowModel().flatRows.findIndex((row) => row.id === selectedRowData?.id)
  // Get the ID of the next row in the table for navigation
  const nextId = useMemo(
    () => table.getCoreRowModel().flatRows[index + 1]?.id,
    [index, isLoading, table]
  )

  // Get the ID of the previous row in the table for navigation
  const prevId = useMemo(
    () => table.getCoreRowModel().flatRows[index - 1]?.id,
    [index, isLoading, table]
  )

  // Navigate to the previous row when called
  const onPrev = useCallback(() => {
    if (prevId) table.setRowSelection({ [prevId]: true })
  }, [prevId, table])

  // Navigate to the next row when called
  const onNext = useCallback(() => {
    if (nextId) table.setRowSelection({ [nextId]: true })
  }, [nextId, table])

  // Close the current row selection
  const onClose = useCallback(() => {
    table.resetRowSelection()
  }, [table])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!selectedRowKey) return

      // REMINDER: prevent dropdown navigation inside of sheet to change row selection
      const activeElement = document.activeElement
      const isMenuActive = activeElement?.closest('[role="menu"]')

      if (isMenuActive) return

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        onPrev()
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        onNext()
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [selectedRowKey, onNext, onPrev])

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3 min-w-0 flex-1 mr-6">
        {logType && <LogTypeIcon type={logType} size={16} className="text-foreground/70" />}
        {method && (
          <Badge variant="default" className="font-mono text-xs rounded px-1">
            {method}
          </Badge>
        )}
        {displayPath.isTruncatable ? (
          <TruncatedTextWithPopover
            text={displayPath.text}
            maxLength={60}
            className={`font-mono text-sm truncate ${displayPath.isDefault ? 'text-foreground-muted' : 'text-foreground'}`}
          />
        ) : (
          <span
            className={`font-mono text-sm truncate ${displayPath.isDefault ? 'text-foreground-muted' : 'text-foreground'}`}
          >
            {displayPath.text}
          </span>
        )}
      </div>

      <div className="flex h-7 items-center gap-1">
        {status && (
          <DataTableColumnStatusCode
            value={status}
            level={getStatusLevel(status)}
            className="text-xs"
          />
        )}
        <ButtonTooltip
          size="tiny"
          type="text"
          disabled={!prevId}
          onClick={onPrev}
          className="px-1"
          icon={<ChevronUp />}
          tooltip={{
            content: {
              text: (
                <p>
                  Navigate <Kbd>↑</Kbd>
                </p>
              ),
            },
          }}
        />
        <ButtonTooltip
          size="tiny"
          type="text"
          disabled={!nextId}
          onClick={onNext}
          className="px-1"
          icon={<ChevronDown />}
          tooltip={{
            content: {
              text: (
                <p>
                  Navigate <Kbd>↓</Kbd>
                </p>
              ),
            },
          }}
        />
        <Separator orientation="vertical" className="mx-1" />

        <Button size="tiny" type="text" onClick={onClose} className="px-1" icon={<X />} />
      </div>
    </div>
  )
}

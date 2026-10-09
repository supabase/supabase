import { cn, TableCell, TableRow } from 'ui'

import { HoverCardTimestamp } from './HoverCardTimestamp'

export function LogRefreshMarker({
  refreshedAt,
  columnIds,
}: {
  refreshedAt: number
  columnIds: string[]
}) {
  const dateColumnIndex = columnIds.indexOf('date')
  const timestampColumnIndex = Math.max(0, dateColumnIndex)
  const hasSeparateTimestampCell = dateColumnIndex >= 0 && dateColumnIndex < columnIds.length - 1

  if (columnIds.length === 0) return null

  return (
    <TableRow className="bg-surface-75 hover:bg-surface-75">
      {timestampColumnIndex > 0 && <TableCell colSpan={timestampColumnIndex} className="p-0" />}
      {hasSeparateTimestampCell && (
        <TableCell className="pl-3 pr-2 py-1 text-xs text-foreground-lighter font-mono tracking-tight">
          <HoverCardTimestamp date={new Date(refreshedAt)} />
        </TableCell>
      )}
      <TableCell
        colSpan={columnIds.length - timestampColumnIndex - Number(hasSeparateTimestampCell)}
        className={cn(
          'px-2 py-1 text-xs text-foreground-lighter',
          !hasSeparateTimestampCell && 'pl-3'
        )}
      >
        <div className="flex items-center gap-3 font-mono tracking-tight">
          {!hasSeparateTimestampCell && <HoverCardTimestamp date={new Date(refreshedAt)} />}
          <span className="uppercase">Refresh</span>
          <div aria-hidden="true" className="h-px flex-1 bg-border" />
        </div>
      </TableCell>
    </TableRow>
  )
}

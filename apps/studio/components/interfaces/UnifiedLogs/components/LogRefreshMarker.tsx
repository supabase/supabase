import { TableCell, TableRow } from 'ui'

import { HoverCardTimestamp } from './HoverCardTimestamp'

export function LogRefreshMarker({
  refreshedAt,
  columnIds,
}: {
  refreshedAt: number
  columnIds: string[]
}) {
  const timestampColumnIndex = Math.max(0, columnIds.indexOf('date'))

  return (
    <TableRow className="bg-surface-75 hover:bg-surface-75">
      {timestampColumnIndex > 0 && <TableCell colSpan={timestampColumnIndex} className="p-0" />}
      <TableCell
        colSpan={columnIds.length - timestampColumnIndex}
        className="pl-3 pr-2 py-1 text-xs text-foreground-lighter"
      >
        <div className="flex items-center gap-3 font-mono tracking-tight">
          <HoverCardTimestamp date={new Date(refreshedAt)} />
          <span>Refresh</span>
        </div>
      </TableCell>
    </TableRow>
  )
}

import { TableCell, TableRow } from 'ui'

export function LiveRow({ colSpan }: { colSpan: number }) {
  return (
    <TableRow>
      <TableCell className="relative w-[--header-level-size] min-w-[--header-level-size] max-w-[--header-level-size] border-b border-r border-t border-info">
        <div className="flex items-center justify-center">
          <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-brand opacity-75"></span>
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand"></span>
        </div>
      </TableCell>
      <TableCell colSpan={colSpan} className="border-b border-r border-t text-foreground">
        Live Mode
      </TableCell>
    </TableRow>
  )
}

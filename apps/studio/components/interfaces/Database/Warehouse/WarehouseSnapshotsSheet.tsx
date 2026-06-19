import { ChevronDown } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetSection,
  SheetTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from 'ui'
import { TimestampInfo } from 'ui-patterns'

import { getWarehouseSnapshots, type WarehouseSnapshot } from './warehouseDemoStore'
import { formatSnapshotSize } from './warehouseSnapshot.utils'

interface WarehouseSnapshotsSheetProps {
  open: boolean
  tableKey: string
  stacked?: boolean
  onOpenChange: (open: boolean) => void
  onQuerySnapshot: (snapshot: WarehouseSnapshot) => void
  onRestoreSnapshot: (snapshot: WarehouseSnapshot) => void
}

function SnapshotActionsDropdown({
  onQuery,
  onRestore,
}: {
  onQuery: () => void
  onRestore: () => void
}) {
  return (
    <div className="flex justify-end">
      <div className="flex">
        <Button
          type="button"
          size="tiny"
          variant="default"
          className="rounded-r-none hover:z-10"
          onClick={onQuery}
        >
          Query
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="tiny"
              variant="default"
              aria-label="More snapshot actions"
              className="shrink-0 rounded-l-none px-[4px] py-[5px] -ml-px"
              icon={<ChevronDown />}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onRestore}>Restore</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function WarehouseSnapshotsSheet({
  open,
  tableKey,
  stacked = false,
  onOpenChange,
  onQuerySnapshot,
  onRestoreSnapshot,
}: WarehouseSnapshotsSheetProps) {
  const snapshots = getWarehouseSnapshots(tableKey)

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={!stacked}>
      <SheetTitle className="sr-only">Snapshots</SheetTitle>
      <SheetDescription className="sr-only">
        Warehouse snapshots for {tableKey}
      </SheetDescription>
      <SheetContent
        size={stacked ? 'sm' : 'default'}
        className={cn(
          'flex flex-col gap-0',
          stacked && 'z-[60] shadow-2xl lg:max-w-md lg:w-[28rem]'
        )}
        hasOverlay={!stacked}
        onInteractOutside={(event) => {
          if (!stacked) return
          const target = event.target as Element
          if (target.closest('[data-testid="table-editor-side-panel"]')) {
            event.preventDefault()
          }
        }}
      >
        <SheetHeader>
          <SheetTitle>Snapshots</SheetTitle>
          <p className="text-sm text-foreground-light">
            <code className="text-code-inline">{tableKey}</code>
          </p>
        </SheetHeader>

        <SheetSection className="min-h-0 flex-1 overflow-auto py-4">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-surface-100">
              <TableRow>
                <TableHead>Snapshot</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshots.map((snapshot, index) => (
                <TableRow key={snapshot.id}>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <TimestampInfo
                        className="text-sm"
                        utcTimestamp={snapshot.createdAt}
                        displayAs="local"
                      />
                      {index === 0 && (
                        <span className="text-xs text-foreground-light">Latest</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground-light">
                    {formatSnapshotSize(snapshot)}
                  </TableCell>
                  <TableCell>
                    <SnapshotActionsDropdown
                      onQuery={() => onQuerySnapshot(snapshot)}
                      onRestore={() => onRestoreSnapshot(snapshot)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SheetSection>
      </SheetContent>
    </Sheet>
  )
}

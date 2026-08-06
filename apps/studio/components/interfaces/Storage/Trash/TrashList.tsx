import dayjs from 'dayjs'
import {
  Button,
  Checkbox,
  cn,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { type TrashObject } from '@/data/storage/protection/protection-mocks'
import { formatBytes } from '@/lib/helpers'

interface TrashListProps {
  objects: TrashObject[]
  selectedIds: string[]
  isRestoring: boolean
  onToggleSelect: (id: string, isShiftHeld: boolean) => void
  onToggleSelectAll: () => void
  onRestore: (object: TrashObject) => void
  onDeleteForever: (object: TrashObject) => void
}

export const TrashList = ({
  objects,
  selectedIds,
  isRestoring,
  onToggleSelect,
  onToggleSelectAll,
  onRestore,
  onDeleteForever,
}: TrashListProps) => {
  const isAllSelected = objects.length > 0 && objects.every((o) => selectedIds.includes(o.id))
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox
              checked={isAllSelected}
              className={cn(isSomeSelected && 'opacity-60')}
              onClick={onToggleSelectAll}
              aria-label="Select all deleted files"
            />
          </TableHead>
          <TableHead>Object</TableHead>
          <TableHead>Original location</TableHead>
          <TableHead>Deleted</TableHead>
          <TableHead className="text-right">Size</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {objects.map((object) => {
          const isSelected = selectedIds.includes(object.id)
          return (
            <TableRow
              key={object.id}
              className={cn('group', isSelected && 'bg-selection hover:bg-selection')}
            >
              <TableCell>
                <Checkbox
                  checked={isSelected}
                  className={cn(
                    isSelected
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
                  )}
                  onClick={(event) => onToggleSelect(object.id, event.nativeEvent.shiftKey)}
                  aria-label={`Select ${object.name}`}
                />
              </TableCell>
              <TableCell className="text-foreground">{object.name}</TableCell>
              <TableCell className="font-mono text-xs text-foreground-lighter">
                {object.originalPath}
              </TableCell>
              <TableCell className="text-foreground-light">
                <Tooltip>
                  <TooltipTrigger>{dayjs(object.deletedAt).fromNow()}</TooltipTrigger>
                  <TooltipContent>
                    {dayjs(object.deletedAt).format('MMM D, YYYY · HH:mm')} · {object.deletedBy}
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell className="text-right text-foreground-light tabular-nums">
                {formatBytes(object.size)}
              </TableCell>
              <TableCell>
                {object.expiresAt ? (
                  <span className="text-warning-600">{dayjs(object.expiresAt).fromNow()}</span>
                ) : (
                  <span className="text-foreground-lighter">Never</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-x-2">
                  <Button variant="default" loading={isRestoring} onClick={() => onRestore(object)}>
                    Restore
                  </Button>
                  <Button variant="danger" onClick={() => onDeleteForever(object)}>
                    Delete permanently
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

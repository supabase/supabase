import dayjs from 'dayjs'
import { Lock } from 'lucide-react'
import {
  Button,
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

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { type TrashObject } from '@/data/storage/protection/protection-mocks'
import { formatBytes } from '@/lib/helpers'

interface TrashListProps {
  objects: TrashObject[]
  isRestoring: boolean
  onRestore: (object: TrashObject) => void
  onDeleteForever: (object: TrashObject) => void
}

export const TrashList = ({
  objects,
  isRestoring,
  onRestore,
  onDeleteForever,
}: TrashListProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Object</TableHead>
          <TableHead>Original location</TableHead>
          <TableHead>Deleted</TableHead>
          <TableHead className="text-right">Size</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {objects.map((object) => (
          <TableRow key={object.id}>
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
              {object.heldBySnapshot ? (
                <span className="flex items-center gap-x-1.5 text-destructive">
                  <Lock size={12} /> Held by snapshot
                </span>
              ) : object.expiresAt ? (
                <span className="text-warning-600">{dayjs(object.expiresAt).fromNow()}</span>
              ) : (
                <span className="text-foreground-lighter">Never</span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-x-2">
                <Button
                  variant="default"
                  loading={isRestoring}
                  onClick={() => onRestore(object)}
                >
                  Restore
                </Button>
                <ButtonTooltip
                  variant="outline"
                  disabled={object.heldBySnapshot}
                  onClick={() => onDeleteForever(object)}
                  tooltip={{
                    content: {
                      side: 'bottom',
                      text: object.heldBySnapshot
                        ? 'Held by a snapshot — delete the snapshot first'
                        : 'Delete permanently',
                    },
                  }}
                >
                  Delete forever
                </ButtonTooltip>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

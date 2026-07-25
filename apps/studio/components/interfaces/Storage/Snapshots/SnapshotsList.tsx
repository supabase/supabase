import dayjs from 'dayjs'
import {
  Badge,
  Button,
  cn,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'

import { type BucketSnapshot } from '@/data/storage/protection/protection-mocks'
import { formatBytes } from '@/lib/helpers'

const shortId = (id: string) => `${id.slice(0, 9)}…${id.slice(-2)}`

interface SnapshotsListProps {
  snapshots: BucketSnapshot[]
  onRestore: (snapshot: BucketSnapshot) => void
}

export const SnapshotsList = ({ snapshots, onRestore }: SnapshotsListProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Snapshot</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Trigger</TableHead>
          <TableHead className="text-right">Objects</TableHead>
          <TableHead className="text-right">Size</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {snapshots.map((snapshot) => {
          const isAvailable = snapshot.status === 'available'
          return (
            <TableRow key={snapshot.id}>
              <TableCell>
                <div className="flex items-center gap-x-2">
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      isAvailable ? 'bg-brand' : 'bg-foreground-muted'
                    )}
                    aria-hidden
                  />
                  <span className="font-mono text-foreground">{shortId(snapshot.id)}</span>
                </div>
              </TableCell>
              <TableCell className="text-foreground-light">
                {dayjs(snapshot.createdAt).format('MMM D, YYYY · HH:mm')}
              </TableCell>
              <TableCell>
                {snapshot.trigger === 'pre-backup' ? (
                  <span className="inline-flex items-center rounded-full border border-blue-800 bg-blue-500/10 px-2 py-0.5 text-xs text-blue-1100">
                    Pre-backup
                  </span>
                ) : (
                  <Badge variant="default">Manual</Badge>
                )}
              </TableCell>
              <TableCell className="text-right text-foreground-light tabular-nums">
                {snapshot.objectCount.toLocaleString()}
              </TableCell>
              <TableCell className="text-right text-foreground-light tabular-nums">
                {formatBytes(snapshot.sizeBytes)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="default"
                  disabled={!isAvailable}
                  onClick={() => onRestore(snapshot)}
                >
                  Restore
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

import dayjs from 'dayjs'
import { CornerDownRight, Lock } from 'lucide-react'
import { Fragment, useState } from 'react'
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
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { type TrashObject } from '@/data/storage/protection/protection-mocks'
import { formatBytes } from '@/lib/helpers'

const shortVersion = (versionId: string) =>
  versionId.length > 8 ? `${versionId.slice(0, 6)}…${versionId.slice(-2)}` : versionId

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

  /** Track which top-level object is targeted for "delete all versions" */
  const [deleteAllTarget, setDeleteAllTarget] = useState<TrashObject>()
  /** Track which single noncurrent version is targeted for deletion */
  const [deleteVersionTarget, setDeleteVersionTarget] = useState<{
    object: TrashObject
    versionId: string
  }>()

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={isAllSelected}
                className={cn(isSomeSelected && 'opacity-60')}
                onClick={onToggleSelectAll}
                aria-label="Select all deleted versions"
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
            const hasVersions = object.noncurrentVersions && object.noncurrentVersions.length > 0

            return (
              <Fragment key={object.id}>
                {/* Top-level delete-marker row */}
                <TableRow className={cn('group', isSelected && 'bg-selection hover:bg-selection')}>
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
                      <ButtonTooltip
                        variant="default"
                        loading={isRestoring}
                        onClick={() => onRestore(object)}
                        tooltip={{
                          content: {
                            side: 'bottom',
                            text: hasVersions ? 'Restore latest version' : 'Restore',
                          },
                        }}
                      >
                        {hasVersions ? 'Restore latest' : 'Restore'}
                      </ButtonTooltip>
                      {hasVersions ? (
                        <ButtonTooltip
                          variant="outline"
                          disabled={object.heldBySnapshot}
                          onClick={() => setDeleteAllTarget(object)}
                          tooltip={{
                            content: {
                              side: 'bottom',
                              text: object.heldBySnapshot
                                ? 'Held by a snapshot — delete the snapshot first'
                                : 'Permanently delete all versions',
                            },
                          }}
                        >
                          Delete all versions
                        </ButtonTooltip>
                      ) : (
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
                          Delete permanently
                        </ButtonTooltip>
                      )}
                    </div>
                  </TableCell>
                </TableRow>

                {/* Nested noncurrent version rows */}
                {hasVersions &&
                  object.noncurrentVersions.map((version) => (
                    <TableRow
                      key={`${object.id}-${version.versionId}`}
                      className="bg-surface-100 hover:bg-surface-200"
                    >
                      <TableCell />
                      <TableCell className="text-foreground-light">
                        <div className="flex items-center gap-x-1.5 pl-4">
                          <CornerDownRight size={12} className="text-foreground-muted shrink-0" />
                          <span className="font-mono text-xs">
                            {shortVersion(version.versionId)}
                          </span>
                          <span className="text-foreground-lighter text-xs">
                            · {version.action}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell />
                      <TableCell className="text-foreground-lighter text-xs">
                        {dayjs(version.createdAt).format('MMM D, YYYY')}
                      </TableCell>
                      <TableCell className="text-right text-foreground-lighter tabular-nums text-xs">
                        {formatBytes(version.size)}
                      </TableCell>
                      <TableCell />
                      <TableCell>
                        <div className="flex items-center justify-end">
                          <Button
                            variant="outline"
                            size="tiny"
                            onClick={() =>
                              setDeleteVersionTarget({ object, versionId: version.versionId })
                            }
                          >
                            Delete permanently
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>

      {/* Confirm: delete all versions of an object */}
      <ConfirmationModal
        variant="destructive"
        visible={deleteAllTarget !== undefined}
        title={`Permanently delete all versions of ${deleteAllTarget?.name ?? 'this file'}`}
        confirmLabel="Delete all versions"
        confirmLabelLoading="Deleting..."
        onCancel={() => setDeleteAllTarget(undefined)}
        onConfirm={() => {
          if (deleteAllTarget) {
            onDeleteForever(deleteAllTarget)
            setDeleteAllTarget(undefined)
          }
        }}
      >
        <p className="text-sm text-foreground-light">
          All versions of{' '}
          <span className="font-medium text-foreground">{deleteAllTarget?.name}</span> will be
          permanently deleted and can no longer be restored. This action cannot be undone.
        </p>
      </ConfirmationModal>

      {/* Confirm: delete a single noncurrent version */}
      <ConfirmationModal
        variant="destructive"
        visible={deleteVersionTarget !== undefined}
        title="Permanently delete version"
        confirmLabel="Delete permanently"
        confirmLabelLoading="Deleting..."
        onCancel={() => setDeleteVersionTarget(undefined)}
        onConfirm={() => {
          // In the prototype, deleting a single noncurrent version doesn't
          // affect the top-level object — it's just a toast.
          setDeleteVersionTarget(undefined)
        }}
      >
        <p className="text-sm text-foreground-light">
          Version{' '}
          <span className="font-mono text-foreground">
            {deleteVersionTarget ? shortVersion(deleteVersionTarget.versionId) : ''}
          </span>{' '}
          of {deleteVersionTarget?.object.name} will be permanently deleted. This action cannot be
          undone.
        </p>
      </ConfirmationModal>
    </>
  )
}

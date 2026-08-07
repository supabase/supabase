import dayjs from 'dayjs'
import { ChevronDown, ChevronRight, CornerDownRight, RotateCcw, Trash2 } from 'lucide-react'
import { Fragment, useState } from 'react'
import { toast } from 'sonner'
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

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import {
  type DeletedObjectVersion,
  type TrashObject,
} from '@/data/storage/protection/protection-mocks'
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

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const totalVersionCount = (object: TrashObject) => {
    return 1 + (object.noncurrentVersions?.length ?? 0)
  }

  return (
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
          const hasVersions =
            object.noncurrentVersions !== undefined && object.noncurrentVersions.length > 0
          const isExpanded = expandedIds.has(object.id)

          return (
            <Fragment key={object.id}>
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
                <TableCell>
                  <div className="flex items-center gap-x-2">
                    {hasVersions && (
                      <button
                        className="flex items-center text-foreground-lighter hover:text-foreground transition-colors"
                        onClick={() => toggleExpanded(object.id)}
                        aria-label={isExpanded ? 'Collapse versions' : 'Expand versions'}
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    )}
                    <span className="text-foreground">{object.name}</span>
                    {hasVersions && (
                      <span className="text-xs text-foreground-muted">
                        {totalVersionCount(object)} versions
                      </span>
                    )}
                  </div>
                </TableCell>
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
                    <Button
                      variant="default"
                      loading={isRestoring}
                      onClick={() => onRestore(object)}
                    >
                      Restore
                    </Button>
                    <Button variant="danger" onClick={() => onDeleteForever(object)}>
                      Delete permanently
                    </Button>
                  </div>
                </TableCell>
              </TableRow>

              {hasVersions &&
                isExpanded &&
                object.noncurrentVersions!.map((version) => (
                  <NoncurrentVersionRow
                    key={version.versionId}
                    version={version}
                    onRestore={() => {
                      toast.success(`Restoring version ${version.versionId.slice(0, 8)} to current`)
                    }}
                    onDelete={() => {
                      toast.success(`Permanently deleted version ${version.versionId.slice(0, 8)}`)
                    }}
                  />
                ))}
            </Fragment>
          )
        })}
      </TableBody>
    </Table>
  )
}

interface NoncurrentVersionRowProps {
  version: DeletedObjectVersion
  onRestore: () => void
  onDelete: () => void
}

const NoncurrentVersionRow = ({ version, onRestore, onDelete }: NoncurrentVersionRowProps) => {
  const shortId = version.versionId.slice(0, 8)

  return (
    <TableRow className="bg-surface-100/50 group">
      <TableCell />
      <TableCell colSpan={2}>
        <div className="flex items-center gap-1.5 pl-6">
          <CornerDownRight size={12} className="text-foreground-muted shrink-0" />
          <span className="text-foreground-lighter font-mono text-xs">{shortId}</span>
          <span className="text-foreground-muted text-xs">({version.action})</span>
        </div>
      </TableCell>
      <TableCell className="text-foreground-lighter text-xs">
        {dayjs(version.createdAt).format('MMM D, YYYY · HH:mm')}
      </TableCell>
      <TableCell className="text-right text-foreground-lighter tabular-nums text-xs">
        {formatBytes(version.size)}
      </TableCell>
      <TableCell />
      <TableCell>
        <div className="flex items-center justify-end gap-x-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <ButtonTooltip
            variant="default"
            size="tiny"
            icon={<RotateCcw size={12} />}
            onClick={onRestore}
            tooltip={{ content: { side: 'bottom', text: 'Restore to current' } }}
          />
          <ButtonTooltip
            variant="danger"
            size="tiny"
            icon={<Trash2 size={12} />}
            onClick={onDelete}
            tooltip={{ content: { side: 'bottom', text: 'Delete permanently' } }}
          />
        </div>
      </TableCell>
    </TableRow>
  )
}

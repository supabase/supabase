import dayjs from 'dayjs'
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  RotateCcw,
  Trash2,
} from 'lucide-react'
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
  onRestoreVersion?: (parent: TrashObject, version: DeletedObjectVersion) => void
  onDeleteVersionForever?: (parent: TrashObject, version: DeletedObjectVersion) => void
}

export const TrashList = ({
  objects,
  selectedIds,
  isRestoring,
  onToggleSelect,
  onToggleSelectAll,
  onRestore,
  onDeleteForever,
  onRestoreVersion,
  onDeleteVersionForever,
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

  const expandableIds = objects
    .filter((o) => o.noncurrentVersions && o.noncurrentVersions.length > 0)
    .map((o) => o.id)
  const isAllExpanded = expandableIds.length > 0 && expandableIds.every((id) => expandedIds.has(id))

  const expandAll = () => setExpandedIds(new Set(expandableIds))
  const collapseAll = () => setExpandedIds(new Set())

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
          <TableHead className="text-right">
            {expandableIds.length > 0 && (
              <div className="flex items-center justify-end gap-x-1">
                <ButtonTooltip
                  variant="text"
                  size="tiny"
                  className="px-1"
                  icon={isAllExpanded ? <ChevronsDownUp size={14} /> : <ChevronsUpDown size={14} />}
                  onClick={isAllExpanded ? collapseAll : expandAll}
                  tooltip={{
                    content: {
                      side: 'bottom',
                      text: isAllExpanded ? 'Collapse all versions' : 'Expand all versions',
                    },
                  }}
                />
              </div>
            )}
          </TableHead>
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
                object.noncurrentVersions!.map((version, index) => (
                  <NoncurrentVersionRow
                    key={version.versionId}
                    version={version}
                    isLast={index === object.noncurrentVersions!.length - 1}
                    onRestore={() => onRestoreVersion?.(object, version)}
                    onDelete={() => onDeleteVersionForever?.(object, version)}
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
  isLast: boolean
  onRestore: () => void
  onDelete: () => void
}

const NoncurrentVersionRow = ({
  version,
  isLast,
  onRestore,
  onDelete,
}: NoncurrentVersionRowProps) => {
  const shortId = version.versionId.slice(0, 8)

  return (
    <TableRow className="bg-surface-100/50 group">
      <TableCell />
      <TableCell className="relative py-1.5" colSpan={2}>
        {/* Tree connector: vertical line — solid color to avoid overlap artifacts */}
        <div
          className={cn(
            'absolute left-[23px] w-px bg-[hsl(0_0%_80%)] dark:bg-[hsl(0_0%_30%)] pointer-events-none',
            isLast ? 'top-0 h-1/2' : 'inset-y-0'
          )}
        />
        {/* Tree connector: horizontal branch */}
        <div className="absolute left-[23px] top-1/2 h-px w-[8px] -translate-y-px bg-[hsl(0_0%_80%)] dark:bg-[hsl(0_0%_30%)] pointer-events-none" />
        {/* Content aligned with parent row text */}
        <div className="flex items-center gap-x-2 pl-[36px]">
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

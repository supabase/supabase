import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { ChevronDown, ChevronRight, RotateCcw, Trash2 } from 'lucide-react'
import { Fragment, useState } from 'react'
import { toast } from 'sonner'
import {
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
import { Admonition } from 'ui-patterns/Admonition'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import {
  useBucketTrashDeleteMutation,
  useBucketTrashQuery,
  useBucketTrashRestoreMutation,
  useTrashVersionDeleteMutation,
  useTrashVersionRestoreMutation,
} from '@/data/storage/protection/bucket-trash-query'
import {
  type DeletedObjectVersion,
  type TrashObject,
} from '@/data/storage/protection/protection-mocks'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { formatBytes } from '@/lib/helpers'

import { toggleSelectAll, toggleSelection } from '../Trash/Trash.utils'
import { useDeletedFilesContext } from './DeletedFilesContext'

/** Composite key for a version row — unambiguous vs. top-level object ids. */
const versionKey = (objectId: string, versionId: string) => `${objectId}::${versionId}`

interface DeletedFilesListProps {
  bucketId: string
  searchString: string
}

export const DeletedFilesList = ({ bucketId, searchString }: DeletedFilesListProps) => {
  const { ref } = useParams()
  const {
    selectedDeletedFile,
    setSelectedDeletedFile,
    selectedDeletedVersion,
    setSelectedDeletedVersion,
    selectedDeletedIds,
    setSelectedDeletedIds,
    lastToggledId,
    setLastToggledId,
    expandedVersionIds,
    setExpandedVersionIds,
  } = useDeletedFilesContext()
  const { can: canUpdateFiles } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  const [fileToDelete, setFileToDelete] = useState<TrashObject>()
  const [versionToDelete, setVersionToDelete] = useState<{
    parentObject: TrashObject
    version: DeletedObjectVersion
  }>()
  const {
    data: objects,
    isPending,
    isError,
    error,
    isSuccess,
  } = useBucketTrashQuery({ projectRef: ref, bucketId })

  // ── Object-level mutations ──────────────────────────────────────────

  const { mutate: restoreObjects, isPending: isRestoring } = useBucketTrashRestoreMutation({
    onSuccess: (_data, variables) => {
      const count = variables.objectIds.length
      toast.success(count === 1 ? 'File restored' : `${count} files restored`)
      if (variables.objectIds.includes(selectedDeletedFile?.id ?? '')) {
        setSelectedDeletedFile(undefined)
      }
      setSelectedDeletedIds(selectedDeletedIds.filter((id) => !variables.objectIds.includes(id)))
    },
  })

  const { mutate: deleteObjects, isPending: isDeleting } = useBucketTrashDeleteMutation({
    onSuccess: (_data, variables) => {
      toast.success('File permanently deleted')
      setFileToDelete(undefined)
      const deletedIds = variables.objectIds ?? []
      if (deletedIds.includes(selectedDeletedFile?.id ?? '')) {
        setSelectedDeletedFile(undefined)
      }
      setSelectedDeletedIds(selectedDeletedIds.filter((id) => !deletedIds.includes(id)))
    },
  })

  // ── Version-level mutations ─────────────────────────────────────────

  const { mutate: restoreVersion, isPending: isRestoringVersion } = useTrashVersionRestoreMutation({
    onSuccess: (_data, variables) => {
      toast.success(`Version ${variables.versionId.slice(0, 8)} restored`)
      // Clear version preview if we just restored the previewed version
      if (selectedDeletedVersion?.version.versionId === variables.versionId) {
        setSelectedDeletedVersion(undefined)
      }
      // Remove from selection
      const key = versionKey(variables.objectId, variables.versionId)
      setSelectedDeletedIds(selectedDeletedIds.filter((id) => id !== key))
    },
  })

  const { mutate: deleteVersionPermanently, isPending: isDeletingVersion } =
    useTrashVersionDeleteMutation({
      onSuccess: (_data, variables) => {
        toast.success(`Version ${variables.versionId.slice(0, 8)} permanently deleted`)
        setVersionToDelete(undefined)
        if (selectedDeletedVersion?.version.versionId === variables.versionId) {
          setSelectedDeletedVersion(undefined)
        }
        const key = versionKey(variables.objectId, variables.versionId)
        setSelectedDeletedIds(selectedDeletedIds.filter((id) => id !== key))
      },
    })

  // ── Loading / error states ──────────────────────────────────────────

  if (isPending) {
    return (
      <div className="p-4">
        <GenericSkeletonLoader />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4">
        <AlertError error={error} subject="Failed to retrieve deleted versions" />
      </div>
    )
  }

  const filtered =
    searchString.length > 0
      ? objects.filter((o) => o.name.toLowerCase().includes(searchString.toLowerCase()))
      : objects

  if (isSuccess && filtered.length === 0) {
    return (
      <div className="p-4">
        <Admonition
          type="default"
          title={searchString.length > 0 ? 'No matching deleted versions' : 'No deleted versions'}
          description={
            searchString.length > 0
              ? 'No deleted versions match your search.'
              : 'Deleted versions appear here and can be restored until an expiration policy removes them.'
          }
        />
      </div>
    )
  }

  // ── Flat ordered ID list (objects + expanded versions) for shift-select ──

  const orderedIds = filtered.flatMap((o) => {
    const ids = [o.id]
    if (expandedVersionIds.has(o.id) && o.noncurrentVersions) {
      for (const v of o.noncurrentVersions) {
        ids.push(versionKey(o.id, v.versionId))
      }
    }
    return ids
  })

  const topLevelIds = filtered.map((o) => o.id)
  const isAllSelected =
    topLevelIds.length > 0 && topLevelIds.every((id) => selectedDeletedIds.includes(id))
  const isSomeSelected = selectedDeletedIds.length > 0 && !isAllSelected

  const handleToggle = (id: string, isShiftHeld: boolean) => {
    const newIds = toggleSelection({
      selectedIds: selectedDeletedIds,
      orderedIds,
      id,
      lastToggledId,
      isShiftHeld,
    })
    setSelectedDeletedIds(newIds)
    setLastToggledId(id)
  }

  const handleToggleAll = () => {
    const newIds = toggleSelectAll(selectedDeletedIds, topLevelIds)
    setSelectedDeletedIds(newIds)
    setLastToggledId(null)
  }

  const handleRestore = (object: TrashObject) => {
    if (!ref) return
    restoreObjects({ projectRef: ref, bucketId, objectIds: [object.id] })
  }

  const handleVersionRestore = (parent: TrashObject, version: DeletedObjectVersion) => {
    if (!ref) return
    restoreVersion({
      projectRef: ref,
      bucketId,
      objectId: parent.id,
      versionId: version.versionId,
    })
  }

  const handleVersionDelete = (parent: TrashObject, version: DeletedObjectVersion) => {
    setVersionToDelete({ parentObject: parent, version })
  }

  const toggleExpanded = (id: string) => {
    setExpandedVersionIds((prev) => {
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

  // ── Preview handlers ────────────────────────────────────────────────

  const handleSelectObject = (object: TrashObject) => {
    setSelectedDeletedFile(object)
    setSelectedDeletedVersion(undefined)
  }

  const handleSelectVersion = (parent: TrashObject, version: DeletedObjectVersion) => {
    setSelectedDeletedVersion({ parentObject: parent, version })
    setSelectedDeletedFile(undefined)
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={isAllSelected}
                className={cn(isSomeSelected && 'opacity-60')}
                onClick={handleToggleAll}
                aria-label="Select all deleted versions"
              />
            </TableHead>
            <TableHead>Object</TableHead>
            <TableHead>Original location</TableHead>
            <TableHead>Deleted</TableHead>
            <TableHead className="text-right">Size</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((object) => {
            const isChecked = selectedDeletedIds.includes(object.id)
            const isPreviewed =
              selectedDeletedFile?.id === object.id && selectedDeletedVersion === undefined
            const hasVersions =
              object.noncurrentVersions !== undefined && object.noncurrentVersions.length > 0
            const isExpanded = expandedVersionIds.has(object.id)

            return (
              <Fragment key={object.id}>
                <TableRow
                  className={cn(
                    'group cursor-pointer',
                    isPreviewed && 'bg-selection hover:bg-selection'
                  )}
                  onClick={() => handleSelectObject(object)}
                >
                  <TableCell className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isChecked}
                      className={cn(
                        isChecked
                          ? 'opacity-100'
                          : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
                      )}
                      onClick={(event) => handleToggle(object.id, event.nativeEvent.shiftKey)}
                      aria-label={`Select ${object.name}`}
                    />
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <div className="flex items-center gap-x-2">
                      {hasVersions && (
                        <button
                          className="flex items-center text-foreground-lighter hover:text-foreground transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleExpanded(object.id)
                          }}
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
                  <TableCell className="px-4 py-2 font-mono text-xs text-foreground-lighter">
                    {object.originalPath}
                  </TableCell>
                  <TableCell className="px-4 py-2 text-foreground-light">
                    <Tooltip>
                      <TooltipTrigger>{dayjs(object.deletedAt).fromNow()}</TooltipTrigger>
                      <TooltipContent>
                        {dayjs(object.deletedAt).format('MMM D, YYYY · HH:mm')} · {object.deletedBy}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="px-4 py-2 text-right text-foreground-light tabular-nums">
                    {formatBytes(object.size)}
                  </TableCell>
                  <TableCell className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-x-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <ButtonTooltip
                        variant="default"
                        size="tiny"
                        icon={<RotateCcw size={14} />}
                        loading={isRestoring}
                        disabled={!canUpdateFiles}
                        onClick={() => handleRestore(object)}
                        tooltip={{
                          content: {
                            side: 'bottom',
                            text: !canUpdateFiles
                              ? 'You need additional permissions to restore files'
                              : 'Restore all versions',
                          },
                        }}
                      />
                      <ButtonTooltip
                        variant="danger"
                        size="tiny"
                        icon={<Trash2 size={14} />}
                        disabled={!canUpdateFiles}
                        onClick={() => setFileToDelete(object)}
                        tooltip={{
                          content: {
                            side: 'bottom',
                            text: !canUpdateFiles
                              ? 'You need additional permissions to delete files'
                              : 'Delete permanently',
                          },
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>

                {hasVersions &&
                  isExpanded &&
                  object.noncurrentVersions!.map((version, index) => {
                    const key = versionKey(object.id, version.versionId)
                    const isVersionChecked = selectedDeletedIds.includes(key)
                    const isVersionPreviewed =
                      selectedDeletedVersion?.version.versionId === version.versionId &&
                      selectedDeletedVersion?.parentObject.id === object.id
                    const isLastVersion = index === object.noncurrentVersions!.length - 1

                    return (
                      <NoncurrentVersionRow
                        key={version.versionId}
                        version={version}
                        parentObject={object}
                        isChecked={isVersionChecked}
                        isPreviewed={isVersionPreviewed}
                        isLast={isLastVersion}
                        canUpdateFiles={canUpdateFiles}
                        isRestoring={isRestoringVersion}
                        onToggleSelect={(isShiftHeld) => handleToggle(key, isShiftHeld)}
                        onClick={() => handleSelectVersion(object, version)}
                        onRestore={() => handleVersionRestore(object, version)}
                        onDelete={() => handleVersionDelete(object, version)}
                      />
                    )
                  })}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>

      {/* Confirm delete for top-level object */}
      <ConfirmationModal
        variant="destructive"
        visible={fileToDelete !== undefined}
        title="Permanently delete file"
        confirmLabel="Delete permanently"
        confirmLabelLoading="Deleting..."
        loading={isDeleting}
        onCancel={() => setFileToDelete(undefined)}
        onConfirm={() => {
          if (!ref || !fileToDelete) return
          deleteObjects({ projectRef: ref, bucketId, objectIds: [fileToDelete.id] })
        }}
      >
        <p className="text-sm text-foreground-light">
          {fileToDelete?.name}
          {fileToDelete?.noncurrentVersions && fileToDelete.noncurrentVersions.length > 0
            ? ` and its ${fileToDelete.noncurrentVersions.length} noncurrent version${fileToDelete.noncurrentVersions.length === 1 ? '' : 's'}`
            : ''}{' '}
          will be permanently deleted and can no longer be restored. This action cannot be undone.
        </p>
      </ConfirmationModal>

      {/* Confirm delete for individual version */}
      <ConfirmationModal
        variant="destructive"
        visible={versionToDelete !== undefined}
        title="Permanently delete version"
        confirmLabel="Delete permanently"
        confirmLabelLoading="Deleting..."
        loading={isDeletingVersion}
        onCancel={() => setVersionToDelete(undefined)}
        onConfirm={() => {
          if (!ref || !versionToDelete) return
          deleteVersionPermanently({
            projectRef: ref,
            bucketId,
            objectId: versionToDelete.parentObject.id,
            versionId: versionToDelete.version.versionId,
          })
        }}
      >
        <p className="text-sm text-foreground-light">
          Version{' '}
          <span className="font-mono text-foreground">
            {versionToDelete?.version.versionId.slice(0, 8)}
          </span>{' '}
          of {versionToDelete?.parentObject.name} will be permanently deleted. This action cannot be
          undone.
        </p>
      </ConfirmationModal>
    </>
  )
}

interface NoncurrentVersionRowProps {
  version: DeletedObjectVersion
  parentObject: TrashObject
  isChecked: boolean
  isPreviewed: boolean
  isLast: boolean
  canUpdateFiles: boolean
  isRestoring: boolean
  onToggleSelect: (isShiftHeld: boolean) => void
  onClick: () => void
  onRestore: () => void
  onDelete: () => void
}

const NoncurrentVersionRow = ({
  version,
  canUpdateFiles,
  isChecked,
  isPreviewed,
  isLast,
  isRestoring,
  onToggleSelect,
  onClick,
  onRestore,
  onDelete,
}: NoncurrentVersionRowProps) => {
  const shortId = `${version.versionId.slice(0, 8)}`

  return (
    <TableRow
      className={cn(
        'bg-surface-100/50 group cursor-pointer',
        isPreviewed && 'bg-selection hover:bg-selection'
      )}
      onClick={onClick}
    >
      <TableCell className="px-4 py-1.5" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isChecked}
          className={cn(
            isChecked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
          )}
          onClick={(event) => onToggleSelect(event.nativeEvent.shiftKey)}
          aria-label={`Select version ${shortId}`}
        />
      </TableCell>
      <TableCell className="relative px-4 py-1.5" colSpan={2}>
        {/* Tree connector: vertical line — solid color to avoid overlap artifacts */}
        <div
          className={cn(
            'absolute left-[23px] w-px bg-[hsl(0_0%_80%)] dark:bg-[hsl(0_0%_30%)] pointer-events-none',
            isLast ? 'top-0 h-1/2' : 'inset-y-0'
          )}
        />
        {/* Tree connector: horizontal branch */}
        <div className="absolute left-[23px] top-1/2 h-px w-[8px] -translate-y-px bg-[hsl(0_0%_80%)] dark:bg-[hsl(0_0%_30%)] pointer-events-none" />
        {/* Content aligned after horizontal branch with gap */}
        <div className="flex items-center gap-x-2 pl-[36px]">
          <span className="text-foreground-lighter font-mono text-xs">{shortId}</span>
          <span className="text-foreground-muted text-xs">({version.action})</span>
        </div>
      </TableCell>
      <TableCell className="px-4 py-1.5 text-foreground-lighter text-xs">
        {dayjs(version.createdAt).format('MMM D, YYYY · HH:mm')}
      </TableCell>
      <TableCell className="px-4 py-1.5 text-right text-foreground-lighter tabular-nums text-xs">
        {formatBytes(version.size)}
      </TableCell>
      <TableCell className="px-4 py-1.5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-x-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <ButtonTooltip
            variant="default"
            size="tiny"
            icon={<RotateCcw size={12} />}
            loading={isRestoring}
            disabled={!canUpdateFiles}
            onClick={onRestore}
            tooltip={{
              content: {
                side: 'bottom',
                text: !canUpdateFiles
                  ? 'You need additional permissions to restore files'
                  : 'Restore to current',
              },
            }}
          />
          <ButtonTooltip
            variant="danger"
            size="tiny"
            icon={<Trash2 size={12} />}
            disabled={!canUpdateFiles}
            onClick={onDelete}
            tooltip={{
              content: {
                side: 'bottom',
                text: !canUpdateFiles
                  ? 'You need additional permissions to delete files'
                  : 'Delete permanently',
              },
            }}
          />
        </div>
      </TableCell>
    </TableRow>
  )
}

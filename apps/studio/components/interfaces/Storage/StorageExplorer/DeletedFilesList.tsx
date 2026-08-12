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
  useTrashCurrentVersionDeleteMutation,
  useTrashVersionDeleteMutation,
} from '@/data/storage/protection/bucket-trash-query'
import { type TrashObject } from '@/data/storage/protection/protection-mocks'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { formatBytes } from '@/lib/helpers'

import { toggleSelectAll, toggleSelection } from '../Trash/Trash.utils'
import { useDeletedFilesContext } from './DeletedFilesContext'
import {
  getMergedArchivedVersions,
  splitDeletedSelection,
  versionKey,
  type ArchivedVersionRow,
} from './DeletedFilesList.utils'

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
    version: ArchivedVersionRow
  }>()
  const {
    data: objects,
    isPending,
    isError,
    error,
    isSuccess,
  } = useBucketTrashQuery({ projectRef: ref, bucketId })

  // ── Group-level mutations — restoring un-archives the whole file, whether
  // triggered from the top-level row or from an individual version row below
  // it (see `handleVersionRestore`). Deleting permanently here removes the
  // group and every version under it. ──────────────────────────────────────

  const { mutate: restoreObjects, isPending: isRestoring } = useBucketTrashRestoreMutation({
    onSuccess: (_data, variables) => {
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

  // ── Version-level mutations — only for permanently deleting one version
  // out of the group; there's no version-level restore endpoint since
  // restoring any version un-archives the whole group (see above). Which
  // mutation a delete dispatches to depends on whether the row is the
  // synthetic "was current at archive" one or a genuine noncurrent version. ─

  const { mutate: deleteVersionPermanently, isPending: isDeletingVersion } =
    useTrashVersionDeleteMutation({
      onSuccess: (_data, variables) => {
        toast.success(`Version ${variables.versionId.slice(0, 8)} permanently deleted`)
        setVersionToDelete(undefined)
        const key = versionKey(variables.objectId, variables.versionId)
        setSelectedDeletedIds(selectedDeletedIds.filter((id) => id !== key))
      },
    })

  const { mutate: deleteCurrentVersionPermanently, isPending: isDeletingCurrentVersion } =
    useTrashCurrentVersionDeleteMutation({
      onSuccess: (_data, variables) => {
        toast.success('Version permanently deleted')
        setVersionToDelete(undefined)
        // The synthetic "was current at archive" row's versionId is the
        // object's own id (see `getMergedArchivedVersions`) — only that one
        // key stops being valid; every other version under this object is
        // untouched by this mutation.
        const key = versionKey(variables.objectId, variables.objectId)
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
        <AlertError error={error} subject="Failed to retrieve archived files" />
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
          title={searchString.length > 0 ? 'No matching archived files' : 'No archived files'}
          description={
            searchString.length > 0
              ? 'No archived files match your search.'
              : 'Files and their version history appear here once archived (soft-deleted), and can be restored until an expiration policy removes them.'
          }
        />
      </div>
    )
  }

  // ── Flat ordered ID list (objects + expanded versions) for shift-select ──

  const orderedIds = filtered.flatMap((o) => {
    const ids = [o.id]
    if (expandedVersionIds.has(o.id)) {
      for (const v of getMergedArchivedVersions(o)) {
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
    restoreObjects(
      { projectRef: ref, bucketId, objectIds: [object.id] },
      { onSuccess: () => toast.success('File restored') }
    )
  }

  const handleVersionRestore = (parent: TrashObject, version: ArchivedVersionRow) => {
    if (!ref) return
    restoreObjects(
      { projectRef: ref, bucketId, objectIds: [parent.id] },
      {
        onSuccess: () =>
          toast.success(
            version.wasCurrentAtArchive
              ? 'File restored'
              : `File restored — version ${version.versionId.slice(0, 8)} is now the current version`
          ),
      }
    )
  }

  const handleVersionDelete = (parent: TrashObject, version: ArchivedVersionRow) => {
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

  // ── Preview handlers ────────────────────────────────────────────────

  const handleSelectObject = (object: TrashObject) => {
    setSelectedDeletedFile(object)
    setSelectedDeletedVersion(undefined)
  }

  const handleSelectVersion = (parent: TrashObject, version: ArchivedVersionRow) => {
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
                aria-label="Select all archived files"
              />
            </TableHead>
            <TableHead>Object</TableHead>
            <TableHead>Original location</TableHead>
            <TableHead>Archived</TableHead>
            <TableHead className="text-right">Size</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((object) => {
            const isChecked = selectedDeletedIds.includes(object.id)
            const isPreviewed =
              selectedDeletedFile?.id === object.id && selectedDeletedVersion === undefined
            const mergedVersions = getMergedArchivedVersions(object)
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
                      <span className="text-foreground">{object.name}</span>
                      <span className="text-xs text-foreground-muted">
                        {mergedVersions.length} version{mergedVersions.length === 1 ? '' : 's'}
                      </span>
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
                              : 'Restore latest version',
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

                {isExpanded &&
                  mergedVersions.map((version, index) => {
                    const key = versionKey(object.id, version.versionId)
                    const isVersionChecked = selectedDeletedIds.includes(key)
                    const isVersionPreviewed =
                      selectedDeletedVersion?.version.versionId === version.versionId &&
                      selectedDeletedVersion?.parentObject.id === object.id
                    const isLastVersion = index === mergedVersions.length - 1
                    const isDeletingThisVersion = version.wasCurrentAtArchive
                      ? isDeletingCurrentVersion
                      : isDeletingVersion

                    return (
                      <ArchivedVersionTableRow
                        key={version.versionId}
                        version={version}
                        isChecked={isVersionChecked}
                        isPreviewed={isVersionPreviewed}
                        isLast={isLastVersion}
                        canUpdateFiles={canUpdateFiles}
                        isRestoring={isRestoring}
                        isDeleting={isDeletingThisVersion}
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
        loading={isDeletingVersion || isDeletingCurrentVersion}
        onCancel={() => setVersionToDelete(undefined)}
        onConfirm={() => {
          if (!ref || !versionToDelete) return
          if (versionToDelete.version.wasCurrentAtArchive) {
            deleteCurrentVersionPermanently({
              projectRef: ref,
              bucketId,
              objectId: versionToDelete.parentObject.id,
            })
          } else {
            deleteVersionPermanently({
              projectRef: ref,
              bucketId,
              objectId: versionToDelete.parentObject.id,
              versionId: versionToDelete.version.versionId,
            })
          }
        }}
      >
        <p className="text-sm text-foreground-light">
          {versionToDelete?.version.wasCurrentAtArchive ? (
            <>
              The version of {versionToDelete?.parentObject.name} that was current when it was
              archived will be permanently deleted
              {(versionToDelete?.parentObject.noncurrentVersions?.length ?? 0) > 0
                ? ' — its next most recent version becomes the one shown here'
                : ', leaving nothing left to restore'}
              . This action cannot be undone.
            </>
          ) : (
            <>
              Version{' '}
              <span className="font-mono text-foreground">
                {versionToDelete?.version.versionId.slice(0, 8)}
              </span>{' '}
              of {versionToDelete?.parentObject.name} will be permanently deleted. This action
              cannot be undone.
            </>
          )}
        </p>
      </ConfirmationModal>
    </>
  )
}

interface ArchivedVersionTableRowProps {
  version: ArchivedVersionRow
  isChecked: boolean
  isPreviewed: boolean
  isLast: boolean
  canUpdateFiles: boolean
  isRestoring: boolean
  isDeleting: boolean
  onToggleSelect: (isShiftHeld: boolean) => void
  onClick: () => void
  onRestore: () => void
  onDelete: () => void
}

const ArchivedVersionTableRow = ({
  version,
  canUpdateFiles,
  isChecked,
  isPreviewed,
  isLast,
  isRestoring,
  isDeleting,
  onToggleSelect,
  onClick,
  onRestore,
  onDelete,
}: ArchivedVersionTableRowProps) => {
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
                  : version.wasCurrentAtArchive
                    ? 'Restore latest version'
                    : 'Restore — this version becomes current',
              },
            }}
          />
          <ButtonTooltip
            variant="danger"
            size="tiny"
            icon={<Trash2 size={12} />}
            loading={isDeleting}
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

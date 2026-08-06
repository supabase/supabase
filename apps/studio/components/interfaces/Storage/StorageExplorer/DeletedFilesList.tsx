import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
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
} from '@/data/storage/protection/bucket-trash-query'
import { type TrashObject } from '@/data/storage/protection/protection-mocks'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { formatBytes } from '@/lib/helpers'

import { toggleSelectAll, toggleSelection } from '../Trash/Trash.utils'
import { useDeletedFilesContext } from './DeletedFilesContext'

interface DeletedFilesListProps {
  bucketId: string
  searchString: string
}

export const DeletedFilesList = ({ bucketId, searchString }: DeletedFilesListProps) => {
  const { ref } = useParams()
  const {
    selectedDeletedFile,
    setSelectedDeletedFile,
    selectedDeletedIds,
    setSelectedDeletedIds,
    lastToggledId,
    setLastToggledId,
  } = useDeletedFilesContext()
  const { can: canUpdateFiles } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  const [fileToDelete, setFileToDelete] = useState<TrashObject>()

  const {
    data: objects,
    isPending,
    isError,
    error,
    isSuccess,
  } = useBucketTrashQuery({ projectRef: ref, bucketId })

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
        <AlertError error={error} subject="Failed to retrieve deleted files" />
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
          title={searchString.length > 0 ? 'No matching deleted files' : 'No deleted files'}
          description={
            searchString.length > 0
              ? 'No deleted files match your search.'
              : 'Deleted objects appear here and can be restored until a lifecycle policy removes them.'
          }
        />
      </div>
    )
  }

  const orderedIds = filtered.map((o) => o.id)
  const isAllSelected =
    orderedIds.length > 0 && orderedIds.every((id) => selectedDeletedIds.includes(id))
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
    const newIds = toggleSelectAll(selectedDeletedIds, orderedIds)
    setSelectedDeletedIds(newIds)
    setLastToggledId(null)
  }

  const handleRestore = (object: TrashObject) => {
    if (!ref) return
    restoreObjects({ projectRef: ref, bucketId, objectIds: [object.id] })
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
          {filtered.map((object) => {
            const isChecked = selectedDeletedIds.includes(object.id)
            const isPreviewed = selectedDeletedFile?.id === object.id

            return (
              <TableRow
                key={object.id}
                className={cn(
                  'group cursor-pointer',
                  isPreviewed && 'bg-selection hover:bg-selection'
                )}
                onClick={() => setSelectedDeletedFile(object)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
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
                <TableCell onClick={(e) => e.stopPropagation()}>
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
                            : 'Restore',
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
            )
          })}
        </TableBody>
      </Table>

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
          {fileToDelete?.name} will be permanently deleted and can no longer be restored. This
          action cannot be undone.
        </p>
      </ConfirmationModal>
    </>
  )
}

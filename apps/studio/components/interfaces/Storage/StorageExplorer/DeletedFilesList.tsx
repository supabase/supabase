import { useParams } from 'common'
import dayjs from 'dayjs'
import { Checkbox, cn } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { AlertError } from '@/components/ui/AlertError'
import { useBucketTrashQuery } from '@/data/storage/protection/bucket-trash-query'
import { type TrashObject } from '@/data/storage/protection/protection-mocks'
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

  const {
    data: objects,
    isPending,
    isError,
    error,
    isSuccess,
  } = useBucketTrashQuery({ projectRef: ref, bucketId })

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

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="flex items-center gap-3 border-b border-overlay px-4 py-2 bg-surface-100">
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={handleToggleAll}
          aria-label={isAllSelected ? 'Unselect all deleted files' : 'Select all deleted files'}
        />
        <button
          type="button"
          className="text-xs text-foreground-lighter hover:text-foreground transition-colors"
          onClick={handleToggleAll}
        >
          {isAllSelected ? 'Unselect' : 'Select'} all {filtered.length} file
          {filtered.length !== 1 ? 's' : ''}
        </button>
      </div>
      {filtered.map((object) => (
        <DeletedFileRow
          key={object.id}
          object={object}
          isSelected={selectedDeletedFile?.id === object.id}
          isChecked={selectedDeletedIds.includes(object.id)}
          onSelect={() => setSelectedDeletedFile(object)}
          onToggle={(e) => handleToggle(object.id, e.shiftKey)}
        />
      ))}
    </div>
  )
}

interface DeletedFileRowProps {
  object: TrashObject
  isSelected: boolean
  isChecked: boolean
  onSelect: () => void
  onToggle: (e: React.MouseEvent) => void
}

const DeletedFileRow = ({
  object,
  isSelected,
  isChecked,
  onSelect,
  onToggle,
}: DeletedFileRowProps) => {
  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'flex items-center gap-3 border-b border-overlay px-4 py-2.5 transition-colors cursor-pointer',
        isSelected ? 'bg-surface-200' : 'hover:bg-surface-100'
      )}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect()
      }}
    >
      <Checkbox
        checked={isChecked}
        onClick={(e) => {
          e.stopPropagation()
          onToggle(e)
        }}
        aria-label={`Select ${object.name}`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{object.name}</p>
        <p className="text-xs text-foreground-lighter">
          {formatBytes(object.size)} · deleted {dayjs(object.deletedAt).format('MMM D, HH:mm')} ·
          from {object.originalPath}
        </p>
      </div>
      {object.heldBySnapshot && (
        <span className="text-xs text-foreground-lighter shrink-0">held</span>
      )}
    </div>
  )
}

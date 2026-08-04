import { useParams } from 'common'
import dayjs from 'dayjs'
import { cn } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { AlertError } from '@/components/ui/AlertError'
import { useBucketTrashQuery } from '@/data/storage/protection/bucket-trash-query'
import { type TrashObject } from '@/data/storage/protection/protection-mocks'
import { formatBytes } from '@/lib/helpers'

import { useDeletedFilesContext } from './DeletedFilesContext'

interface DeletedFilesListProps {
  bucketId: string
}

export const DeletedFilesList = ({ bucketId }: DeletedFilesListProps) => {
  const { ref } = useParams()
  const { selectedDeletedFile, setSelectedDeletedFile } = useDeletedFilesContext()

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

  if (isSuccess && objects.length === 0) {
    return (
      <div className="p-4">
        <Admonition
          type="default"
          title="No deleted files"
          description="Deleted objects appear here and can be restored until a lifecycle policy removes them."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      {objects.map((object) => (
        <DeletedFileRow
          key={object.id}
          object={object}
          isSelected={selectedDeletedFile?.id === object.id}
          onSelect={() => setSelectedDeletedFile(object)}
        />
      ))}
    </div>
  )
}

interface DeletedFileRowProps {
  object: TrashObject
  isSelected: boolean
  onSelect: () => void
}

const DeletedFileRow = ({ object, isSelected, onSelect }: DeletedFileRowProps) => {
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

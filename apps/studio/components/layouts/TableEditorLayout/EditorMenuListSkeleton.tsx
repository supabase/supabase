import { memo } from 'react'
import { Skeleton } from 'ui'

const EditorMenuListSkeleton = memo(function EditorMenuListSkeleton() {
  const items = [
    { width: 'w-40', opacity: 'opacity-100' },
    { width: 'w-32', opacity: 'opacity-100' },
    { width: 'w-20', opacity: 'opacity-75' },
    { width: 'w-40', opacity: 'opacity-50' },
    { width: 'w-20', opacity: 'opacity-25' },
  ]

  return (
    <div className="px-4 flex flex-col gap-0">
      {items.map((item, index) => (
        <div key={index} className={`flex flex-row h-6 items-center gap-3 ${item.opacity}`}>
          <Skeleton className="h-4 w-5" />
          <Skeleton className={`h-4 ${item.width}`} />
        </div>
      ))}
    </div>
  )
})

export default EditorMenuListSkeleton

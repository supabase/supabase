import { useSortable } from '@dnd-kit/sortable'
import { GripVertical } from 'lucide-react'
import { CSSProperties, PropsWithChildren } from 'react'
import { cn } from 'ui'

// [Joshen] Might very well de-duplicate with SortableSection since its the exact same behaviour
export const CellWrapper = ({ id, children }: PropsWithChildren<{ id: string }>) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const style: CSSProperties = {
    transform: transform
      ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
      : undefined,
    transition,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative will-change-transform flex items-start gap-x-2"
    >
      <button
        type="button"
        aria-label="Drag to reorder section"
        className={cn(
          'text-foreground-muted hover:text-foreground cursor-grab active:cursor-grabbing',
          'mt-2.5 rounded-sm focus-ring'
        )}
        {...attributes}
        {...listeners}
        tabIndex={0}
      >
        <GripVertical size={14} />
      </button>
      <div className={cn('w-full', isDragging && 'opacity-70')}>{children}</div>
    </div>
  )
}

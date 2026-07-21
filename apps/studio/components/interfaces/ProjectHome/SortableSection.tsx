import { useSortable } from '@dnd-kit/sortable'
import { GripVertical } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from 'ui'

type SortableSectionProps = {
  id: string
  children: ReactNode
}

export const SortableSection = ({ id, children }: SortableSectionProps) => {
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
    <div ref={setNodeRef} style={style} className="relative will-change-transform">
      <button
        type="button"
        aria-label="Drag to reorder section"
        className={cn(
          'absolute -left-6 top-2 text-foreground-muted hover:text-foreground cursor-grab active:cursor-grabbing',
          'rounded-sm outline-hidden',
          'focus-visible:outline-solid focus-visible:outline-4 focus-visible:outline-offset-1 focus-visible:outline-border-strong'
        )}
        {...attributes}
        {...listeners}
        tabIndex={0}
      >
        <GripVertical size={14} />
      </button>
      <div className={cn(isDragging && 'opacity-70')}>{children}</div>
    </div>
  )
}

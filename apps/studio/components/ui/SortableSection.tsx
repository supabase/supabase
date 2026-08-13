import { useSortable } from '@dnd-kit/sortable'
import { GripVertical } from 'lucide-react'
import type { CSSProperties, PropsWithChildren } from 'react'
import { Button, cn } from 'ui'

export const SortableSection = ({
  id,
  children,
  gripClassName,
}: PropsWithChildren<{ id: string; gripClassName?: string }>) => {
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
      className="relative will-change-transform flex items-start gap-x-4"
    >
      <Button
        type="button"
        variant="text"
        aria-label="Drag to reorder section"
        className={cn(
          'w-6 text-foreground-muted hover:text-foreground cursor-grab active:cursor-grabbing',
          'rounded-sm focus-ring',
          gripClassName
        )}
        {...attributes}
        {...listeners}
        tabIndex={0}
        icon={<GripVertical />}
      />
      <div className={cn('w-full', isDragging && 'opacity-70')}>{children}</div>
    </div>
  )
}

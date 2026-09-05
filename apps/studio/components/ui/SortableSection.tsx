import { useDndMonitor } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { GripVertical } from 'lucide-react'
import type { CSSProperties, PropsWithChildren, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Button, cn, DropdownMenu, DropdownMenuTrigger } from 'ui'

export const SortableSection = ({
  id,
  children,
  actions,
  gripClassName,
  gripDropdownContent,
}: PropsWithChildren<{
  id: string
  gripClassName?: string
  actions?: ReactNode
  gripDropdownContent?: ReactNode
}>) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const [menuOpen, setMenuOpen] = useState(false)
  const isDraggingRef = useRef(false)
  const openTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useDndMonitor({
    onDragStart: (event) => {
      if (event.active.id === id) {
        isDraggingRef.current = true
        clearTimeout(openTimeoutRef.current)
        setMenuOpen(false)
      }
    },
    onDragEnd: (event) => {
      if (event.active.id === id) isDraggingRef.current = false
    },
    onDragCancel: (event) => {
      if (event.active.id === id) isDraggingRef.current = false
    },
  })

  useEffect(() => () => clearTimeout(openTimeoutRef.current), [])

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
      className="group relative will-change-transform flex items-start gap-x-4 min-w-0"
    >
      <div className={cn('flex items-center', gripClassName)}>
        {actions}
        <DropdownMenu
          open={menuOpen}
          onOpenChange={(open) => {
            clearTimeout(openTimeoutRef.current)

            if (!open) {
              setMenuOpen(false)
              return
            }

            openTimeoutRef.current = setTimeout(() => {
              if (!isDraggingRef.current) setMenuOpen(true)
            }, 150)
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="text"
              aria-label="Drag to reorder section"
              className={cn(
                'w-6 text-foreground-muted hover:text-foreground cursor-grab active:cursor-grabbing',
                'rounded-sm focus-ring'
              )}
              {...attributes}
              {...listeners}
              tabIndex={0}
              icon={<GripVertical />}
            />
          </DropdownMenuTrigger>
          {gripDropdownContent}
        </DropdownMenu>
      </div>
      <div className={cn('w-full min-w-0', isDragging && 'opacity-70')}>{children}</div>
    </div>
  )
}

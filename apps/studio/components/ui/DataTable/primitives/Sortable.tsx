import type {
  DndContextProps,
  DraggableSyntheticListeners,
  DropAnimation,
  UniqueIdentifier,
} from '@dnd-kit/core'
import {
  closestCenter,
  defaultDropAnimationSideEffects,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Slot } from 'radix-ui'
import { createContext, forwardRef, useContext, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button, cn, type ButtonProps } from 'ui'

import { composeRefs } from '../hooks/useComposedRefs'

interface SortableProps<TData extends { id: UniqueIdentifier }> extends DndContextProps {
  /**
   * An array of data items that the sortable component will render.
   * @example
   * value={[
   *   { id: 1, name: 'Item 1' },
   *   { id: 2, name: 'Item 2' },
   * ]}
   */
  value: TData[]

  /**
   * An optional callback function that is called when the order of the data items changes.
   * It receives the new array of items as its argument.
   * @example
   * onValueChange={(items) => console.log(items)}
   */
  onValueChange?: (items: TData[]) => void

  /**
   * A collision detection strategy that will be used to determine the closest sortable item.
   * @default closestCenter
   * @type DndContextProps["collisionDetection"]
   */
  collisionDetection?: DndContextProps['collisionDetection']

  /**
   * An array of modifiers that will be used to modify the behavior of the sortable component.
   * @default
   * [restrictToVerticalAxis, restrictToParentElement]
   * @type Modifier[]
   */
  modifiers?: DndContextProps['modifiers']

  /**
   * An optional React node that is rendered on top of the sortable component.
   * It can be used to display additional information or controls.
   * @default null
   * @type React.ReactNode | null
   * @example
   * overlay={<Skeleton className="w-full h-8" />}
   */
  overlay?: React.ReactNode | null
}

export function Sortable<TData extends { id: UniqueIdentifier }>({
  value,
  onValueChange,
  onDragStart,
  onDragEnd,
  onDragCancel,
  collisionDetection = closestCenter,
  modifiers,
  overlay,
  children,
  ...props
}: SortableProps<TData>) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor)
  )

  return (
    <DndContext
      modifiers={modifiers ?? [restrictToVerticalAxis, restrictToParentElement]}
      sensors={sensors}
      onDragStart={(event) => {
        setActiveId(event.active.id)
        onDragStart?.(event)
      }}
      onDragEnd={(event) => {
        const { active, over } = event
        if (over && active.id !== over?.id) {
          const activeIndex = value.findIndex((item) => item.id === active.id)
          const overIndex = value.findIndex((item) => item.id === over.id)

          onValueChange?.(arrayMove(value, activeIndex, overIndex))
        }
        setActiveId(null)
        onDragEnd?.(event)
      }}
      onDragCancel={(event) => {
        setActiveId?.(null)
        onDragCancel?.(event)
      }}
      collisionDetection={collisionDetection}
      {...props}
    >
      <SortableContext items={value} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
      {overlay
        ? // https://docs.dndkit.com/api-documentation/draggable/drag-overlay#portals
          createPortal(
            <SortableOverlay activeId={activeId}>{overlay}</SortableOverlay>,
            document.body
          )
        : null}
    </DndContext>
  )
}

const dropAnimationOpts: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.4',
      },
    },
  }),
}

interface SortableOverlayProps extends React.ComponentPropsWithRef<typeof DragOverlay> {
  activeId?: UniqueIdentifier | null
}

export const SortableOverlay = forwardRef<HTMLDivElement, SortableOverlayProps>(
  ({ activeId, dropAnimation = dropAnimationOpts, children, ...props }, ref) => {
    return (
      <DragOverlay dropAnimation={dropAnimation} {...props}>
        {activeId ? (
          <SortableItem ref={ref} value={activeId} className="cursor-grabbing" asChild>
            {children}
          </SortableItem>
        ) : null}
      </DragOverlay>
    )
  }
)
SortableOverlay.displayName = 'SortableOverlay'

interface SortableItemContextProps {
  attributes: React.HTMLAttributes<HTMLElement>
  listeners: DraggableSyntheticListeners | undefined
  isDragging?: boolean
}

const SortableItemContext = createContext<SortableItemContextProps>({
  attributes: {},
  listeners: undefined,
  isDragging: false,
})

function useSortableItem() {
  const context = useContext(SortableItemContext)

  if (!context) {
    throw new Error('useSortableItem must be used within a SortableItem')
  }

  return context
}

interface SortableItemProps extends Slot.SlotProps {
  /**
   * The unique identifier of the item.
   * @example "item-1"
   * @type UniqueIdentifier
   */
  value: UniqueIdentifier

  /**
   * Merges the item's props into its immediate child.
   * @default false
   * @type boolean | undefined
   */
  asChild?: boolean
}

export const SortableItem = forwardRef<HTMLDivElement, SortableItemProps>(
  ({ value, asChild, className, ...props }, ref) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: value,
    })

    const context = useMemo<SortableItemContextProps>(
      () => ({
        attributes,
        listeners,
        isDragging,
      }),
      [attributes, listeners, isDragging]
    )
    const style: React.CSSProperties = {
      opacity: isDragging ? 0.5 : 1,
      transform: CSS.Translate.toString(transform),
      transition,
    }

    const Comp = asChild ? Slot.Slot : 'div'

    return (
      <SortableItemContext.Provider value={context}>
        <Comp
          data-state={isDragging ? 'dragging' : undefined}
          className={cn('data-[state=dragging]:cursor-grabbing', className)}
          ref={composeRefs(ref, setNodeRef as React.Ref<HTMLDivElement>)}
          style={style}
          {...props}
        />
      </SortableItemContext.Provider>
    )
  }
)
SortableItem.displayName = 'SortableItem'

export const SortableDragHandle = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    const { attributes, listeners, isDragging } = useSortableItem()

    return (
      <Button
        ref={composeRefs(ref)}
        data-state={isDragging ? 'dragging' : undefined}
        className={cn('cursor-grab data-[state=dragging]:cursor-grabbing', className)}
        {...attributes}
        {...listeners}
        {...props}
      />
    )
  }
)
SortableDragHandle.displayName = 'SortableDragHandle'

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
import {
  restrictToHorizontalAxis,
  restrictToParentElement,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers'
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  type SortableContextProps,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Slot, type SlotProps } from '@radix-ui/react-slot'
import { createContext, forwardRef, useContext, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import { Button, cn, type ButtonProps } from 'ui'
import { composeRefs } from '../hooks/useComposedRefs'

const orientationConfig = {
  vertical: {
    modifiers: [restrictToVerticalAxis, restrictToParentElement],
    strategy: verticalListSortingStrategy,
  },
  horizontal: {
    modifiers: [restrictToHorizontalAxis, restrictToParentElement],
    strategy: horizontalListSortingStrategy,
  },
  mixed: {
    modifiers: [restrictToParentElement],
    strategy: undefined,
  },
}

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
   * An optional callback function that is called when an item is moved.
   * It receives an event object with `activeIndex` and `overIndex` properties, representing the original and new positions of the moved item.
   * This will override the default behavior of updating the order of the data items.
   * @type (event: { activeIndex: number; overIndex: number }) => void
   * @example
   * onMove={(event) => console.log(`Item moved from index ${event.activeIndex} to index ${event.overIndex}`)}
   */
  onMove?: (event: { activeIndex: number; overIndex: number }) => void

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
   * A sorting strategy that will be used to determine the new order of the data items.
   * @default verticalListSortingStrategy
   * @type SortableContextProps["strategy"]
   */
  strategy?: SortableContextProps['strategy']

  /**
   * Specifies the axis for the drag-and-drop operation. It can be "vertical", "horizontal", or "both".
   * @default "vertical"
   * @type "vertical" | "horizontal" | "mixed"
   */
  orientation?: 'vertical' | 'horizontal' | 'mixed'

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

function Sortable<TData extends { id: UniqueIdentifier }>({
  value,
  onValueChange,
  onDragStart,
  onDragEnd,
  onDragCancel,
  collisionDetection = closestCenter,
  modifiers,
  strategy,
  onMove,
  orientation = 'vertical',
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

  const config = orientationConfig[orientation]

  return (
    <DndContext
      modifiers={modifiers ?? config.modifiers}
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

          if (onMove) {
            onMove({ activeIndex, overIndex })
          } else {
            onValueChange?.(arrayMove(value, activeIndex, overIndex))
          }
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
      <SortableContext items={value} strategy={strategy ?? config.strategy}>
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

const SortableOverlay = forwardRef<HTMLDivElement, SortableOverlayProps>(
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

interface SortableItemProps extends SlotProps {
  /**
   * The unique identifier of the item.
   * @example "item-1"
   * @type UniqueIdentifier
   */
  value: UniqueIdentifier

  /**
   * Specifies whether the item should act as a trigger for the drag-and-drop action.
   * @default false
   * @type boolean | undefined
   */
  asTrigger?: boolean

  /**
   * Merges the item's props into its immediate child.
   * @default false
   * @type boolean | undefined
   */
  asChild?: boolean
}

const SortableItem = forwardRef<HTMLDivElement, SortableItemProps>(
  ({ value, asTrigger, asChild, className, ...props }, ref) => {
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

    const Comp = asChild ? Slot : 'div'

    return (
      <SortableItemContext.Provider value={context}>
        <Comp
          data-state={isDragging ? 'dragging' : undefined}
          className={cn(
            'data-[state=dragging]:cursor-grabbing',
            { 'cursor-grab': !isDragging && asTrigger },
            className
          )}
          ref={composeRefs(ref, setNodeRef as React.Ref<HTMLDivElement>)}
          style={style}
          {...(asTrigger ? attributes : {})}
          {...(asTrigger ? listeners : {})}
          {...props}
        />
      </SortableItemContext.Provider>
    )
  }
)
SortableItem.displayName = 'SortableItem'

interface SortableDragHandleProps extends ButtonProps {
  withHandle?: boolean
}

const SortableDragHandle = forwardRef<HTMLButtonElement, SortableDragHandleProps>(
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

export { Sortable, SortableDragHandle, SortableItem, SortableOverlay }

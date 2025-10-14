import { Kbd } from 'components/ui/DataTable/primitives/Kbd'
import { DotSquare, Grid2x2, GripVertical, Pencil, PlusIcon, Save, Star, X } from 'lucide-react'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { type QuickActionOption, useQuickActionOptions } from './quick-actions.utils'
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const KbdSlot = ({ option }: { option: QuickActionOption }) => (
  <div>
    {option.kbd?.map((k) => (
      <Kbd key={`kbd-${k}`} className="text-foreground-lighter">
        {k}
      </Kbd>
    ))}
  </div>
)

interface SortableActionItemProps {
  action: QuickActionOption
  onRemove: (action: QuickActionOption) => void
}

const SortableActionItem = ({ action, onRemove }: SortableActionItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: action.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <DropdownMenuItem
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'cursor-grab active:cursor-grabbing flex items-center gap-2 py-1',
        isDragging && 'opacity-50'
      )}
      onClick={(e) => e.preventDefault()}
    >
      <div className="text-foreground-muted hover:bg-muted/50 rounded">
        <GripVertical size={14} />
      </div>
      <action.icon size={14} className="text-foreground-lighter flex-shrink-0" />
      <span className="text-foreground-light flex-1">{action.label}</span>
      <Button
        type="text"
        size="tiny"
        onClick={() => onRemove(action)}
        className="!p-1 text-destructive hover:text-destructive"
      >
        <X size={12} />
      </Button>
    </DropdownMenuItem>
  )
}

interface ReorderableListProps {
  selectedActions: QuickActionOption[]
  allActions: QuickActionOption[]
  onReorder: (newOrder: QuickActionOption[]) => void
  onToggleAction: (action: QuickActionOption, isSelected: boolean) => void
}

const ReorderableList = ({
  selectedActions,
  allActions,
  onReorder,
  onToggleAction,
}: ReorderableListProps) => {
  const unselectedActions = allActions.filter(
    (action) => !selectedActions.some((selected) => selected.id === action.id)
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = selectedActions.findIndex((item) => item.id === active.id)
      const newIndex = selectedActions.findIndex((item) => item.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(arrayMove(selectedActions, oldIndex, newIndex))
      }
    }
  }

  const removeAction = (action: QuickActionOption) => {
    onToggleAction(action, false)
  }

  const addAction = (action: QuickActionOption) => {
    onToggleAction(action, true)
  }

  return (
    <div className="overflow-y-auto">
      {/* Selected Actions */}
      <DropdownMenuGroup>
        <DropdownMenuLabel>Selected Actions</DropdownMenuLabel>
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext
            items={selectedActions.map((action) => action.id)}
            strategy={verticalListSortingStrategy}
          >
            {selectedActions.map((action) => (
              <SortableActionItem key={action.id} action={action} onRemove={removeAction} />
            ))}
          </SortableContext>
        </DndContext>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />

      {/* Unselected Actions */}
      {unselectedActions.length > 0 && (
        <DropdownMenuGroup>
          <DropdownMenuLabel>Other Actions</DropdownMenuLabel>
          <div>
            {unselectedActions.map((action) => (
              <DropdownMenuItem
                key={`unselected-action-${action.id}`}
                className="flex items-center gap-2 cursor-pointer w-full text-left"
                onClick={(e) => {
                  e.preventDefault()
                  addAction(action)
                }}
              >
                <action.icon size={14} className="text-foreground-lighter flex-shrink-0" />
                <span className="text-foreground-light flex-1">{action.label}</span>
                <div className="flex items-center justify-center text-foreground-lighter hover:text-foreground">
                  <Star size={12} />
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuGroup>
      )}
    </div>
  )
}

const QuickActions = () => {
  const {
    allActions,
    selectedActions,
    setSelectedActions,
    editQuickActions,
    setEditQuickActions,
    saveSelectedActions,
  } = useQuickActionOptions()

  const handleReorder = (newOrder: QuickActionOption[]) => {
    setSelectedActions(newOrder)
  }

  const handleToggleAction = (action: QuickActionOption, isSelected: boolean) => {
    if (isSelected) {
      // Add action to the end of selected actions
      setSelectedActions([...selectedActions, action])
    } else {
      // Remove action from selected actions
      setSelectedActions(selectedActions.filter((a) => a.id !== action.id))
    }
  }

  const handleSave = () => {
    saveSelectedActions()
    setEditQuickActions(false)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-7 h-7 rounded-full hover:!cursor-pointer">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="primary" className="!p-0 rounded-full w-7 h-7">
              <PlusIcon size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Create</TooltipContent>
        </Tooltip>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-64 max-h-[calc(100vh-200px)]">
        {editQuickActions ? (
          <ReorderableList
            selectedActions={selectedActions}
            allActions={allActions}
            onReorder={handleReorder}
            onToggleAction={handleToggleAction}
          />
        ) : (
          <>
            <DropdownMenuLabel>Create...</DropdownMenuLabel>
            {selectedActions.map((option) => (
              <DropdownMenuItem asChild key={option.label}>
                <button
                  type="button"
                  onClick={option.onClick}
                  className="group w-full cursor-pointer flex items-center gap-2 text-foreground-light hover:text-foreground"
                >
                  <option.icon size={14} className="text-foreground-lighter" />
                  <span className="text-left flex-1">{option.label}</span>
                  <KbdSlot option={option} />
                </button>
              </DropdownMenuItem>
            ))}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault()
            if (editQuickActions) {
              handleSave()
            } else {
              setEditQuickActions(true)
            }
          }}
          className="text-center flex justify-center items-center gap-2 w-full text-foreground-light hover:text-foreground"
        >
          {editQuickActions ? (
            <>
              Save <Save size={14} />
            </>
          ) : (
            <>
              Manage <Pencil size={14} />
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default QuickActions

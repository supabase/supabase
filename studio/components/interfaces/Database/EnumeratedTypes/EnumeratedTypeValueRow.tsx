import { Draggable, DraggableProvided } from 'react-beautiful-dnd'
import { Button, IconMenu, IconTrash, Input } from 'ui'

interface EnumeratedTypeValueRowProps {
  index: number
  enumTypeValue: { id: string; value: string }
  onUpdateValue: (id: string, value: string) => void
  onRemoveValue: () => void
}

const EnumeratedTypeValueRow = ({
  index,
  enumTypeValue,
  onUpdateValue,
  onRemoveValue,
}: EnumeratedTypeValueRowProps) => {
  return (
    <Draggable draggableId={enumTypeValue.id} index={index}>
      {(draggableProvided: DraggableProvided) => (
        <div
          ref={draggableProvided.innerRef}
          {...draggableProvided.draggableProps}
          className="flex items-center space-x-2"
        >
          <div {...draggableProvided.dragHandleProps}>
            <IconMenu
              size={16}
              strokeWidth={1.5}
              className="text-foreground-lighter cursor-pointer"
            />
          </div>
          <Input
            className="w-full"
            value={enumTypeValue.value}
            onChange={(e) => onUpdateValue(enumTypeValue.id, e.target.value)}
          />
          <div>
            <Button
              type="default"
              size="small"
              icon={<IconTrash strokeWidth={1.5} size={16} />}
              className="px-2"
              onClick={() => onRemoveValue()}
            />
          </div>
        </div>
      )}
    </Draggable>
  )
}

export default EnumeratedTypeValueRow

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash } from 'lucide-react'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import { Button, FormControl, FormField, FormItem, FormLabel, FormMessage, Input_Shadcn_ } from 'ui'

interface EnumeratedTypeValueRowProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>
  index: number
  id: string
  name: TName
  isDisabled?: boolean
  onRemoveValue: () => void
}

const EnumeratedTypeValueRow = <TFieldValues extends FieldValues>({
  control,
  index,
  id,
  name,
  isDisabled = false,
  onRemoveValue,
}: EnumeratedTypeValueRowProps<TFieldValues>) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition } =
    useSortable({
      disabled: isDisabled,
      id,
    })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <FormField
      control={control}
      name={name}
      render={({ field: inputField }) => (
        <FormItem ref={setNodeRef} style={style}>
          <FormLabel className="sr-only">Value {index}</FormLabel>
          <FormControl>
            <div className="flex items-center space-x-2 space-y-2">
              <button
                ref={setActivatorNodeRef}
                {...attributes}
                {...listeners}
                className={`opacity-50 hover:opacity-100 disabled:hover:opacity-50 transition cursor-grab ${
                  isDisabled ? 'text-foreground-lighter cursor-default!' : 'text-foreground'
                }`}
                type="button"
                disabled={isDisabled}
              >
                <GripVertical size={16} strokeWidth={1.5} />
              </button>
              <Input_Shadcn_ {...inputField} className="w-full" />
              <Button
                type="default"
                size="small"
                disabled={isDisabled}
                icon={<Trash strokeWidth={1.5} size={16} />}
                className="px-2"
                onClick={() => onRemoveValue()}
              />
            </div>
          </FormControl>
          <FormMessage className="ml-6" />
        </FormItem>
      )}
    />
  )
}

export default EnumeratedTypeValueRow

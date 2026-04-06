import { Plus, Trash } from 'lucide-react'
import {
  Control,
  FieldArray,
  FieldArrayPath,
  FieldArrayWithId,
  FieldPath,
  FieldValues,
  useFieldArray,
} from 'react-hook-form'
import {
  Button,
  cn,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
} from 'ui'

export interface SingleValueFieldArrayProps<
  TFieldValues extends FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues>,
  TItem extends FieldArray<TFieldValues, TFieldArrayName> = FieldArray<
    TFieldValues,
    TFieldArrayName
  >,
> {
  control: Control<TFieldValues>
  name: TFieldArrayName
  valueFieldName: Extract<keyof TItem, string>
  createEmptyRow: () => TItem
  placeholder: string
  addLabel: string
  removeLabel?: string
  disabled?: boolean
  minimumRows?: number
  inputSize?: React.ComponentProps<typeof Input_Shadcn_>['size']
  inputAutoComplete?: string
  className?: string
  rowsClassName?: string
  rowClassName?: string
  inputClassName?: string
  addButtonClassName?: string
  addButtonType?: React.ComponentProps<typeof Button>['type']
  addButtonSize?: React.ComponentProps<typeof Button>['size']
  removeButtonClassName?: string
  removeButtonType?: React.ComponentProps<typeof Button>['type']
  removeButtonSize?: React.ComponentProps<typeof Button>['size']
}

const toFieldPath = <TFieldValues extends FieldValues>(path: string) => {
  return path as FieldPath<TFieldValues>
}

export const SingleValueFieldArray = <
  TFieldValues extends FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues>,
  TItem extends FieldArray<TFieldValues, TFieldArrayName> = FieldArray<
    TFieldValues,
    TFieldArrayName
  >,
>({
  control,
  name,
  valueFieldName,
  createEmptyRow,
  placeholder,
  addLabel,
  removeLabel = 'Remove row',
  disabled = false,
  minimumRows = 0,
  inputSize = 'small',
  inputAutoComplete,
  className,
  rowsClassName = 'space-y-3 mt-1',
  rowClassName,
  inputClassName,
  addButtonClassName,
  addButtonType = 'default',
  addButtonSize,
  removeButtonClassName,
  removeButtonType = 'default',
  removeButtonSize = 'tiny',
}: SingleValueFieldArrayProps<TFieldValues, TFieldArrayName, TItem>) => {
  const { fields, append, remove } = useFieldArray<TFieldValues, TFieldArrayName, 'fieldId'>({
    control,
    name,
    keyName: 'fieldId',
  })

  const typedFields = fields as FieldArrayWithId<TFieldValues, TFieldArrayName, 'fieldId'>[]
  const disableRemove = disabled || typedFields.length <= minimumRows

  return (
    <div className={cn('space-y-3', className)}>
      <div className={rowsClassName}>
        {typedFields.map((field, index) => (
          <div key={field.fieldId} className={cn('flex items-start space-x-2', rowClassName)}>
            <FormField_Shadcn_
              control={control}
              name={toFieldPath<TFieldValues>(`${name}.${index}.${valueFieldName}`)}
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex-1">
                  <FormControl_Shadcn_>
                    <Input_Shadcn_
                      {...field}
                      size={inputSize}
                      autoComplete={inputAutoComplete}
                      className={cn('w-full', inputClassName)}
                      placeholder={placeholder}
                      disabled={disabled}
                    />
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />

            <Button
              type={removeButtonType}
              size={removeButtonSize}
              htmlType="button"
              icon={<Trash size={12} />}
              aria-label={removeLabel}
              disabled={disableRemove}
              onClick={() => remove(index)}
              className={cn('h-[34px] w-[34px] shrink-0', removeButtonClassName)}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center">
        <Button
          type={addButtonType}
          size={addButtonSize}
          htmlType="button"
          icon={<Plus strokeWidth={1.5} />}
          disabled={disabled}
          onClick={() => append(createEmptyRow())}
          className={addButtonClassName}
        >
          {addLabel}
        </Button>
      </div>
    </div>
  )
}

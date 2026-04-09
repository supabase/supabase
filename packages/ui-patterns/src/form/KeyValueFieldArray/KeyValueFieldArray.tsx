import { ChevronDown, Plus, Trash } from 'lucide-react'
import { Fragment, ReactNode } from 'react'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
} from 'ui'

export type KeyValueFieldArrayAction<TItem> = {
  key: string
  label: ReactNode
  description?: ReactNode
  createRows: () => TItem | TItem[]
  separatorAbove?: boolean
}

export interface KeyValueFieldArrayProps<
  TFieldValues extends FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues>,
  TItem extends FieldArray<TFieldValues, TFieldArrayName> = FieldArray<
    TFieldValues,
    TFieldArrayName
  >,
> {
  control: Control<TFieldValues>
  name: TFieldArrayName
  keyFieldName: Extract<keyof TItem, string>
  valueFieldName: Extract<keyof TItem, string>
  createEmptyRow: () => TItem
  keyPlaceholder: string
  valuePlaceholder: string
  addLabel: string
  addActions?: KeyValueFieldArrayAction<TItem>[]
  disabled?: boolean
  inputSize?: React.ComponentProps<typeof Input_Shadcn_>['size']
  className?: string
  rowsClassName?: string
  rowClassName?: string
  keyInputClassName?: string
  valueInputClassName?: string
  addButtonClassName?: string
  removeButtonClassName?: string
  removeLabel?: string
}

const toFieldPath = <TFieldValues extends FieldValues>(path: string) => {
  return path as FieldPath<TFieldValues>
}

const appendRows = <
  TFieldValues extends FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues>,
>(
  append: (
    value: FieldArray<TFieldValues, TFieldArrayName> | FieldArray<TFieldValues, TFieldArrayName>[]
  ) => void,
  rows: FieldArray<TFieldValues, TFieldArrayName> | FieldArray<TFieldValues, TFieldArrayName>[]
) => {
  append(Array.isArray(rows) && rows.length === 1 ? rows[0] : rows)
}

/**
 * Rendering-only field array for text/text pairs.
 *
 * Consumers own validation in their resolver schema and can rely on the nested
 * `FormMessage_Shadcn_` instances here to display per-cell errors.
 */
export const KeyValueFieldArray = <
  TFieldValues extends FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues>,
  TItem extends FieldArray<TFieldValues, TFieldArrayName> = FieldArray<
    TFieldValues,
    TFieldArrayName
  >,
>({
  control,
  name,
  keyFieldName,
  valueFieldName,
  createEmptyRow,
  keyPlaceholder,
  valuePlaceholder,
  addLabel,
  addActions = [],
  disabled = false,
  inputSize = 'small',
  className,
  rowsClassName = 'space-y-3 mt-1',
  rowClassName,
  keyInputClassName,
  valueInputClassName,
  addButtonClassName,
  removeButtonClassName,
  removeLabel = 'Remove row',
}: KeyValueFieldArrayProps<TFieldValues, TFieldArrayName, TItem>) => {
  const { fields, append, remove } = useFieldArray<TFieldValues, TFieldArrayName, 'fieldId'>({
    control,
    name,
    keyName: 'fieldId',
  })

  const typedFields = fields as FieldArrayWithId<TFieldValues, TFieldArrayName, 'fieldId'>[]
  const hasAddActions = addActions.length > 0
  const addActionsLabel = `${addLabel} options`

  return (
    <div className={cn('space-y-3', className)}>
      <div className={rowsClassName}>
        {typedFields.map((field, index) => (
          <div key={field.fieldId} className={cn('flex items-start space-x-2', rowClassName)}>
            <FormField_Shadcn_
              control={control}
              name={toFieldPath<TFieldValues>(`${name}.${index}.${keyFieldName}`)}
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex-1">
                  <FormControl_Shadcn_>
                    <Input_Shadcn_
                      {...field}
                      size={inputSize}
                      className={cn('w-full', keyInputClassName)}
                      placeholder={keyPlaceholder}
                      disabled={disabled}
                    />
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />

            <FormField_Shadcn_
              control={control}
              name={toFieldPath<TFieldValues>(`${name}.${index}.${valueFieldName}`)}
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex-1">
                  <FormControl_Shadcn_>
                    <Input_Shadcn_
                      {...field}
                      size={inputSize}
                      className={cn('w-full', valueInputClassName)}
                      placeholder={valuePlaceholder}
                      disabled={disabled}
                    />
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />

            <Button
              type="default"
              size="tiny"
              htmlType="button"
              icon={<Trash size={12} />}
              aria-label={removeLabel}
              disabled={disabled}
              onClick={() => remove(index)}
              className={cn('h-[34px] w-[34px] shrink-0', removeButtonClassName)}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center">
        <Button
          type="default"
          size="tiny"
          htmlType="button"
          icon={<Plus />}
          disabled={disabled}
          onClick={() => append(createEmptyRow())}
          className={cn(hasAddActions && 'rounded-r-none border-r-0 px-3', addButtonClassName)}
        >
          {addLabel}
        </Button>

        {hasAddActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="default"
                size="tiny"
                htmlType="button"
                icon={<ChevronDown size={14} />}
                aria-label={addActionsLabel}
                disabled={disabled}
                className="rounded-l-none px-[4px] py-[5px]"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom">
              {addActions.map((action) => (
                <Fragment key={action.key}>
                  {action.separatorAbove && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={() =>
                      appendRows<TFieldValues, TFieldArrayName>(
                        append,
                        action.createRows() as
                          | FieldArray<TFieldValues, TFieldArrayName>
                          | FieldArray<TFieldValues, TFieldArrayName>[]
                      )
                    }
                  >
                    {action.description ? (
                      <div className="space-y-1">
                        <div className="block text-foreground">{action.label}</div>
                        <div className="text-foreground-light">{action.description}</div>
                      </div>
                    ) : (
                      action.label
                    )}
                  </DropdownMenuItem>
                </Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronsUpDown, XIcon } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  Control,
  FieldValues,
  SubmitHandler,
  useFieldArray,
  useForm,
  useWatch,
} from 'react-hook-form'
import {
  Button,
  cn,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Form,
  FormControl,
  FormField,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import * as z from 'zod'

import { ColumnType } from './ColumnType'
import type { AvailableColumn, Table, TableOption } from './Wrappers.types'
import { getTableFormSchema } from './Wrappers.utils'
import { useSchemasQuery } from '@/data/database/schemas-query'
import { useSchemasFilteredForHighAvailability } from '@/hooks/misc/useHighAvailability'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

const FORM_ID = 'wrapper-table-editor-form'

export type WrapperTableEditorProps = {
  visible: boolean
  onCancel: () => void
  onSave: (values: any) => void

  tables: Table[]
  initialData: any
}

export const WrapperTableEditor = ({
  visible,
  onCancel,
  onSave,
  tables,
  initialData,
}: WrapperTableEditorProps) => {
  const [open, setOpen] = useState(false)
  const listboxId = useId()
  const [selectedTableIndex, setSelectedTableIndex] = useState<string>('')

  const selectedTable = selectedTableIndex === '' ? undefined : tables[parseInt(selectedTableIndex)]

  const handleCancel = () => {
    setSelectedTableIndex('')
    onCancel()
  }

  const onSubmit: SubmitHandler<FieldValues> = (values) => {
    onSave({
      ...values,
      index: parseInt(selectedTableIndex),
      schema_name: values.schema === 'custom' ? values.schema_name : values.schema,
      is_new_schema: values.schema === 'custom',
    })
    setSelectedTableIndex('')
  }

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setSelectedTableIndex(String(initialData.index))
    }
  }, [initialData])

  return (
    <Sheet open={visible} onOpenChange={(open) => !open && handleCancel()}>
      <SheetContent size="default" className="flex flex-col h-full">
        <SheetHeader>
          <SheetTitle>Edit foreign table</SheetTitle>
        </SheetHeader>
        <SheetSection className="grow overflow-y-auto p-0">
          <div>
            <div className="px-5 pb-5 flex flex-col gap-y-2">
              <Label className="text-foreground-light">
                Select a target the table will point to
              </Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    role="combobox"
                    aria-expanded={open}
                    aria-controls={listboxId}
                    className={cn(
                      'w-full justify-between',
                      !selectedTableIndex && 'text-muted-foreground'
                    )}
                    size="small"
                    iconRight={
                      <ChevronsUpDown
                        className="ml-2 h-4 w-4 shrink-0 opacity-50"
                        strokeWidth={1}
                      />
                    }
                  >
                    {!!selectedTableIndex ? tables[Number(selectedTableIndex)].label : '---'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent id={listboxId} className="p-0" sameWidthAsTrigger>
                  <Command>
                    <CommandInput placeholder="Find a table..." />
                    <CommandList>
                      <CommandEmpty>No targets found</CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className={(tables ?? []).length > 7 ? 'h-[200px]' : ''}>
                          {(tables ?? []).map((table, i) => (
                            <CommandItem
                              key={table.label}
                              className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                              onSelect={() => {
                                setSelectedTableIndex(String(i))
                                setOpen(false)
                              }}
                              onClick={() => {
                                setSelectedTableIndex(String(i))
                                setOpen(false)
                              }}
                            >
                              <div className="space-y-1">
                                <p>{table.label}</p>
                                <p className="text-foreground-lighter">{table.description}</p>
                              </div>
                              {String(i) === selectedTableIndex && (
                                <Check className={cn('mr-2 h-4 w-4')} />
                              )}
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <Separator />

            {selectedTable && (
              <TableForm
                // A prop change alone won't remount TableForm, so without this
                // key, switching targets would reuse the same instance -
                // leaving its one-time defaults sync (hasSyncedDefaultsRef)
                // and field array permanently stuck on the first target ever
                // selected.
                key={selectedTableIndex}
                table={selectedTable}
                onSubmit={onSubmit}
                initialData={initialData}
              />
            )}
          </div>
        </SheetSection>
        <SheetFooter>
          <Button size="tiny" type="button" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="tiny" variant="primary" form={FORM_ID} type="submit">
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

const Option = ({ option, control }: { option: TableOption; control: Control<FieldValues> }) => {
  if (option.type === 'select') {
    return (
      <FormField
        control={control}
        name={option.name}
        defaultValue={option.defaultValue}
        render={({ field }) => (
          <FormItemLayout layout="vertical" label={option.label}>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {option.options.map((subOption) => (
                    <SelectItem key={subOption.value} value={subOption.value}>
                      {subOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
          </FormItemLayout>
        )}
      />
    )
  }

  return (
    <FormField
      control={control}
      name={option.name}
      defaultValue={option.defaultValue ?? ''}
      render={({ field }) => (
        <FormItemLayout layout="vertical" label={option.label}>
          <FormControl>
            <Input {...field} placeholder={option.placeholder ?? ''} />
          </FormControl>
        </FormItemLayout>
      )}
    />
  )
}

const TableForm = ({
  table,
  onSubmit,
  initialData,
}: {
  table: Table
  onSubmit: SubmitHandler<FieldValues>
  initialData: any
}) => {
  const { data: project } = useSelectedProjectQuery()
  const { data: allSchemas, isPending: isLoading } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const schemas = useSchemasFilteredForHighAvailability(allSchemas)

  const requiredOptions: TableOption[] = []
  const optionalOptions: TableOption[] = []
  const nonEditableOptions: TableOption[] = []

  table.options.forEach((option) => {
    if (option.editable) {
      if (option.required && !option.defaultValue) {
        requiredOptions.push(option)
        return
      }
      optionalOptions.push(option)
      return
    }
    nonEditableOptions.push(option)
  })

  const defaultValues = useMemo(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const { schema } = initialData
      const existingSchema = schemas?.find((s) => s.name === schema)

      return {
        schema_name: existingSchema ? '' : schema,
        schema: existingSchema ? existingSchema.name : 'custom',
        ...Object.fromEntries(
          table.options.map((option) => [option.name, option.defaultValue ?? ''])
        ),
        ...initialData,
      }
    }
    return {
      table_name: '',
      columns: table.availableColumns ?? [],
      schema: 'public',
      ...Object.fromEntries(
        table.options.map((option) => [option.name, option.defaultValue ?? ''])
      ),
    }
  }, [initialData, table, schemas])

  const formSchema = getTableFormSchema(table)
  type FormSchema = z.infer<typeof formSchema>

  const form = useForm<FormSchema>({
    defaultValues,
    resolver: zodResolver(formSchema),
  })

  const {
    fields: columnFields,
    append: appendColumn,
    replace: replaceColumns,
    remove: removeColumn,
  } = useFieldArray({
    control: form.control,
    name: 'columns',
  })

  const { reset } = form
  const hasSyncedDefaultsRef = useRef(false)

  const handleSubmit: SubmitHandler<FieldValues> = (values) => {
    const { schema_name, schema, ...valuesWithoutSchema } = values
    onSubmit({
      ...valuesWithoutSchema,
      // Ensure all options are accounted for.
      ...Object.fromEntries(
        table.options.map((option) => [
          option.name,
          values[option.name] ?? option.defaultValue ?? '',
        ])
      ),
      schema,
      schema_name: schema === 'custom' ? schema_name : schema,
      is_new_schema: schema === 'custom',
    })
    reset()
  }

  const { errors } = form.formState
  const schema = useWatch({ name: 'schema', control: form.control })

  useEffect(() => {
    if (isLoading || hasSyncedDefaultsRef.current) return
    hasSyncedDefaultsRef.current = true
    reset(defaultValues)
    // Workaround bug in react-hook-form
    replaceColumns(defaultValues.columns ?? [])
  }, [isLoading, reset, replaceColumns, defaultValues])

  return (
    <Form {...form}>
      <form
        id={FORM_ID}
        onSubmit={(event) => {
          event.stopPropagation()
          form.handleSubmit(handleSubmit)(event)
        }}
      >
        {isLoading && <ShimmeringLoader className="py-4" />}

        <div className="flex flex-col gap-y-4 p-5">
          <FormField
            control={form.control}
            name="schema"
            render={({ field }) => (
              <FormItemLayout layout="vertical" label="Select a schema for the foreign table">
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={(schema) => {
                      field.onChange(schema)
                      form.resetField('schema_name')
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Create a new schema</SelectItem>
                      <SelectSeparator />
                      {(schemas ?? [])?.map((schema) => {
                        return (
                          <SelectItem key={schema.name} value={schema.name}>
                            {schema.name}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItemLayout>
            )}
          />

          {schema === 'custom' && (
            <FormField
              control={form.control}
              name="schema_name"
              render={({ field }) => (
                <FormItemLayout layout="vertical" label="Schema name">
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItemLayout>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="table_name"
            render={({ field }) => (
              <FormItemLayout
                layout="vertical"
                label="Table name"
                description="You can query from this table after the wrapper is enabled."
              >
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItemLayout>
            )}
          />

          {requiredOptions.map((option) => (
            <Option key={option.name} option={option} control={form.control} />
          ))}

          {nonEditableOptions.map((option) => (
            <input key={option.name} type="hidden" {...form.register(option.name)} />
          ))}

          {table.availableColumns != null ? (
            <FormField
              control={form.control}
              name="selected_columns"
              render={() => (
                <FormItemLayout
                  layout="vertical"
                  label="Select the columns to be added to your table."
                >
                  <div>
                    <MultiSelector
                      onValuesChange={(selectedColumns) => {
                        const newColumnFieldsValue: AvailableColumn[] = []

                        table.availableColumns!.forEach((availableColumn) => {
                          if (selectedColumns.includes(availableColumn.name)) {
                            newColumnFieldsValue.push(availableColumn)
                          }
                        })
                        replaceColumns(newColumnFieldsValue)
                      }}
                      values={columnFields.map(
                        (column) =>
                          // @ts-expect-error FIXME: cannot make inference work properly
                          column.name
                      )}
                      size="small"
                      className="w-full"
                    >
                      <MultiSelectorTrigger
                        mode="inline-combobox"
                        badgeLimit="wrap"
                        showIcon={false}
                        deletableBadge
                        className="w-full"
                      />
                      <MultiSelectorContent>
                        <MultiSelectorList>
                          {table.availableColumns!.map((availableColumn) => (
                            <MultiSelectorItem
                              key={availableColumn.name}
                              value={availableColumn.name}
                            >
                              {availableColumn.name}
                            </MultiSelectorItem>
                          ))}
                        </MultiSelectorList>
                      </MultiSelectorContent>
                    </MultiSelector>
                  </div>
                </FormItemLayout>
              )}
            />
          ) : (
            <div className="flex flex-col gap-y-2">
              {columnFields.map((column, columnIndex) => (
                <div key={column.id} className="flex items-center gap-x-2">
                  <FormField
                    control={form.control}
                    name={`columns.${columnIndex}.name`}
                    render={({ field }) => (
                      <FormItemLayout layout="vertical" label="Name">
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                  <ColumnType
                    control={form.control}
                    className="w-1/2"
                    name={`columns.${columnIndex}.type`}
                    enumTypes={[]}
                  />
                  <Button
                    variant="outline"
                    icon={<XIcon strokeWidth={1.5} />}
                    onClick={() => removeColumn(columnIndex)}
                    className="self-end -translate-y-1.5 px-1.5"
                    // @ts-expect-error FIXME: cannot make inference work
                    aria-label={`Remove column ${column.name}`}
                  />
                </div>
              ))}
              <Button
                onClick={() => appendColumn({ name: '', type: 'text' })}
                className="self-start"
              >
                Add column
              </Button>
              {errors.columns != null && errors.columns.message != null && (
                <span className="text-red-900 text-sm mt-2">
                  {errors.columns.message.toString()}
                </span>
              )}
            </div>
          )}
        </div>

        <Separator />

        <div className="p-5 flex flex-col gap-y-4">
          {optionalOptions.map((option) => (
            <Option key={option.name} option={option} control={form.control} />
          ))}
        </div>
      </form>
    </Form>
  )
}

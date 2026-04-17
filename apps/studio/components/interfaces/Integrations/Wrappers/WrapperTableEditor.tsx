import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronsUpDown, XIcon } from 'lucide-react'
import { useEffect, useId, useMemo, useState } from 'react'
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
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Label_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  ScrollArea,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectSeparator_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SidePanel,
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
import { ActionBar } from '@/components/interfaces/TableGridEditor/SidePanelEditor/ActionBar'
import { useSchemasQuery } from '@/data/database/schemas-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export type WrapperTableEditorProps = {
  visible: boolean
  onCancel: () => void
  onSave: (values: any) => void

  tables: Table[]
  initialData: any
}

const WrapperTableEditor = ({
  visible,
  onCancel,
  onSave,
  tables,
  initialData,
}: WrapperTableEditorProps) => {
  const [open, setOpen] = useState(false)
  const listboxId = useId()
  const [selectedTableIndex, setSelectedTableIndex] = useState<string>('')

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setSelectedTableIndex(String(initialData.index))
    }
  }, [initialData])

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

  return (
    <SidePanel
      key="WrapperTableEditor"
      size="medium"
      visible={visible}
      onCancel={handleCancel}
      header={<span>Edit foreign table</span>}
      customFooter={
        <ActionBar
          backButtonLabel="Cancel"
          applyButtonLabel="Save"
          formId="wrapper-table-editor-form"
          closePanel={handleCancel}
        />
      }
    >
      <SidePanel.Content>
        <div className="my-4 flex flex-col gap-y-6">
          <div className="flex flex-col gap-y-2">
            <Label_Shadcn_ className="text-foreground-light">
              Select a target the table will point to
            </Label_Shadcn_>
            <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
              <PopoverTrigger_Shadcn_ asChild>
                <Button
                  type="default"
                  role="combobox"
                  aria-expanded={open}
                  aria-controls={listboxId}
                  className={cn(
                    'w-full justify-between',
                    !selectedTableIndex && 'text-muted-foreground'
                  )}
                  size="small"
                  iconRight={
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" strokeWidth={1} />
                  }
                >
                  {!!selectedTableIndex ? tables[Number(selectedTableIndex)].label : '---'}
                </Button>
              </PopoverTrigger_Shadcn_>
              <PopoverContent_Shadcn_ id={listboxId} className="p-0" sameWidthAsTrigger>
                <Command_Shadcn_>
                  <CommandInput_Shadcn_ placeholder="Find a table..." />
                  <CommandList_Shadcn_>
                    <CommandEmpty_Shadcn_>No targets found</CommandEmpty_Shadcn_>
                    <CommandGroup_Shadcn_>
                      <ScrollArea className={(tables ?? []).length > 7 ? 'h-[200px]' : ''}>
                        {(tables ?? []).map((table, i) => (
                          <CommandItem_Shadcn_
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
                          </CommandItem_Shadcn_>
                        ))}
                      </ScrollArea>
                    </CommandGroup_Shadcn_>
                  </CommandList_Shadcn_>
                </Command_Shadcn_>
              </PopoverContent_Shadcn_>
            </Popover_Shadcn_>
          </div>

          {selectedTable && (
            <TableForm table={selectedTable} onSubmit={onSubmit} initialData={initialData} />
          )}
        </div>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default WrapperTableEditor

const Option = ({ option, control }: { option: TableOption; control: Control<FieldValues> }) => {
  if (option.type === 'select') {
    return (
      <FormField_Shadcn_
        control={control}
        name={option.name}
        defaultValue={option.defaultValue}
        render={({ field }) => (
          <FormItemLayout layout="vertical" label={option.label} name={option.name}>
            <FormControl_Shadcn_>
              <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                <SelectTrigger_Shadcn_>
                  <SelectValue_Shadcn_ placeholder="Select an option" />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  <SelectSeparator_Shadcn_ />
                  {option.options.map((subOption) => (
                    <SelectItem_Shadcn_ key={subOption.value} value={subOption.value}>
                      {subOption.label}
                    </SelectItem_Shadcn_>
                  ))}
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </FormControl_Shadcn_>
          </FormItemLayout>
        )}
      />
    )
  }

  return (
    <FormField_Shadcn_
      control={control}
      name={option.name}
      defaultValue={option.defaultValue ?? ''}
      render={({ field }) => (
        <FormItemLayout layout="vertical" label={option.label} name={option.name}>
          <FormControl_Shadcn_>
            <Input_Shadcn_ {...field} id={option.name} placeholder={option.placeholder ?? ''} />
          </FormControl_Shadcn_>
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
  const { data: schemas, isPending: isLoading } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

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
    shouldUnregister: true,
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
  useEffect(() => {
    reset(defaultValues)
    // Workaround bug in react-hook-form
    replaceColumns(defaultValues.columns ?? [])
  }, [reset, replaceColumns, defaultValues])

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

  return (
    <Form_Shadcn_ {...form}>
      <form
        id="wrapper-table-editor-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4"
      >
        {isLoading && <ShimmeringLoader className="py-4" />}

        <FormField_Shadcn_
          control={form.control}
          name="schema"
          render={({ field }) => (
            <FormItemLayout layout="vertical" label="Select a schema for the foreign table">
              <FormControl_Shadcn_>
                <Select_Shadcn_
                  name="schema"
                  value={field.value}
                  onValueChange={(schema) => {
                    field.onChange(schema)
                    form.resetField('schema_name')
                  }}
                >
                  <SelectTrigger_Shadcn_>
                    <SelectValue_Shadcn_ placeholder="Select an option" />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    <SelectItem_Shadcn_ value="custom">Create a new schema</SelectItem_Shadcn_>
                    <SelectSeparator_Shadcn_ />
                    {(schemas ?? [])?.map((schema) => {
                      return (
                        <SelectItem_Shadcn_ key={schema.name} value={schema.name}>
                          {schema.name}
                        </SelectItem_Shadcn_>
                      )
                    })}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </FormControl_Shadcn_>
            </FormItemLayout>
          )}
        />
        {schema === 'custom' && (
          <FormField_Shadcn_
            control={form.control}
            name="schema_name"
            render={({ field }) => (
              <FormItemLayout name="schema_name" layout="vertical" label="Schema name">
                <FormControl_Shadcn_>
                  <Input_Shadcn_ {...field} id="schema_name" />
                </FormControl_Shadcn_>
              </FormItemLayout>
            )}
          />
        )}

        <FormField_Shadcn_
          control={form.control}
          name="table_name"
          render={({ field }) => (
            <FormItemLayout
              layout="vertical"
              name="table_name"
              label="Table name"
              description="You can query from this table after the wrapper is enabled."
            >
              <FormControl_Shadcn_>
                <Input_Shadcn_ {...field} id="table_name" />
              </FormControl_Shadcn_>
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
          <FormField_Shadcn_
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
                      className="w-full !min-w-lg"
                    />
                    <MultiSelectorContent>
                      <MultiSelectorList>
                        {table.availableColumns!.map((availableColumn, index) => (
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
                <FormField_Shadcn_
                  control={form.control}
                  name={`columns.${columnIndex}.name`}
                  render={({ field }) => (
                    <FormItemLayout
                      layout="vertical"
                      name={`columns.${columnIndex}.name`}
                      label="Name"
                    >
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ {...field} id={`columns.${columnIndex}.name`} />
                      </FormControl_Shadcn_>
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
                  type="outline"
                  icon={<XIcon strokeWidth={1.5} />}
                  onClick={() => removeColumn(columnIndex)}
                  className="self-end -translate-y-1.5 px-1.5"
                  // @ts-expect-error FIXME: cannot make inference work
                  aria-label={`Remove column ${column.name}`}
                />
              </div>
            ))}
            <Button
              type="default"
              onClick={() => appendColumn({ name: '', type: 'text' })}
              className="self-start"
            >
              Add column
            </Button>
            {errors.columns != null && errors.columns.message != null && (
              <span className="text-red-900 text-sm mt-2">{errors.columns.message.toString()}</span>
            )}
          </div>
        )}

        {optionalOptions.map((option) => (
          <Option key={option.name} option={option} control={form.control} />
        ))}
      </form>
    </Form_Shadcn_>
  )
}

import { ActionBar } from 'components/interfaces/TableGridEditor/SidePanelEditor/ActionBar'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Check, ChevronsUpDown, Database, Plus } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import {
  Button,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Form,
  Input,
  Label_Shadcn_,
  Listbox,
  Modal,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  ScrollArea,
  SidePanel,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import WrapperDynamicColumns from './WrapperDynamicColumns'
import type { Table, TableOption } from './Wrappers.types'
import { makeValidateRequired } from './Wrappers.utils'

export type WrapperTableEditorProps = {
  visible: boolean
  onCancel: () => void
  onSave: (values: any) => void

  tables: Table[]
  initialData: any
}

type OnSubmitFn = (values: any, { resetForm }: { resetForm: () => void }) => void

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
    if (initialData) {
      setSelectedTableIndex(String(initialData.index))
    }
  }, [initialData])

  const selectedTable = selectedTableIndex === '' ? undefined : tables[parseInt(selectedTableIndex)]

  const handleCancel = () => {
    setSelectedTableIndex('')
    onCancel()
  }

  const onSubmit: OnSubmitFn = (values, { resetForm }) => {
    onSave({
      ...values,
      index: parseInt(selectedTableIndex),
      schema_name: values.schema === 'custom' ? values.schema_name : values.schema,
      is_new_schema: values.schema === 'custom',
    })
    resetForm()
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

const Option = ({ option }: { option: TableOption }) => {
  if (option.type === 'select') {
    return (
      <Listbox
        key={option.name}
        id={option.name}
        name={option.name}
        label={option.label}
        defaultValue={option.defaultValue ?? ''}
      >
        {[
          ...(!option.required
            ? [
                <Listbox.Option key="empty" value="" label="---" className="!w-96">
                  ---
                </Listbox.Option>,
              ]
            : []),
          ...option.options.map((subOption) => (
            <Listbox.Option
              key={subOption.value}
              id={option.name + subOption.value}
              value={subOption.value}
              label={subOption.label}
              className="!w-96"
            >
              {subOption.label}
            </Listbox.Option>
          )),
        ]}
      </Listbox>
    )
  }

  return (
    <Input
      key={option.name}
      id={option.name}
      name={option.name}
      label={option.label}
      placeholder={option.placeholder ?? ''}
      defaultValue={option.defaultValue ?? ''}
    />
  )
}

const TableForm = ({
  table,
  onSubmit,
  initialData,
}: {
  table: Table
  onSubmit: OnSubmitFn
  initialData: any
}) => {
  const { data: project } = useSelectedProjectQuery()
  const {
    data: schemas,
    isPending: isLoading,
    isSuccess,
  } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const requiredOptions =
    table.options.filter((option) => option.editable && option.required && !option.defaultValue) ??
    []
  const optionalOptions =
    table.options.filter(
      (option) => option.editable && (!option.required || option.defaultValue)
    ) ?? []

  const initialValues = initialData ?? {
    table_name: '',
    columns: table.availableColumns ?? [],
    ...Object.fromEntries(table.options.map((option) => [option.name, option.defaultValue ?? ''])),
    schema: 'public',
    schema_name: '',
  }

  const validate = makeValidateRequired([
    ...table.options,
    { name: 'table_name', required: true },
    { name: 'columns', required: true },
    ...(table.availableColumns ? [] : [{ name: 'columns.name', required: true }]),
  ])

  return (
    <Form
      id="wrapper-table-editor-form"
      initialValues={initialValues}
      validate={validate}
      onSubmit={onSubmit}
      enableReinitialize={true}
    >
      {({ errors, values, setFieldValue }: any) => {
        return (
          <div className="space-y-4">
            {isLoading && <ShimmeringLoader className="py-4" />}

            {isSuccess && (
              <Listbox size="small" name="schema" label="Select a schema for the foreign table">
                <Listbox.Option
                  key="custom"
                  id="custom"
                  label={`Create a new schema`}
                  value="custom"
                  addOnBefore={() => <Plus size={16} strokeWidth={1.5} />}
                >
                  Create a new schema
                </Listbox.Option>
                <Modal.Separator />

                {(schemas ?? [])?.map((schema) => {
                  return (
                    <Listbox.Option
                      key={schema.id}
                      id={schema.name}
                      label={schema.name}
                      value={schema.name}
                      addOnBefore={() => <Database size={16} strokeWidth={1.5} />}
                    >
                      {schema.name}
                    </Listbox.Option>
                  )
                })}
              </Listbox>
            )}

            {values.schema === 'custom' && (
              <Input id="schema_name" name="schema_name" label="Schema name" />
            )}
            <Input
              id="table_name"
              name="table_name"
              label="Table name"
              descriptionText="You can query from this table after the wrapper is enabled."
            />
            {requiredOptions.map((option) => (
              <Option key={option.name} option={option} />
            ))}

            <div className="form-group">
              <label className="!w-full">
                {table.availableColumns
                  ? 'Select the columns to be added to your table'
                  : 'Add columns to your table'}
              </label>
              <div className="flex flex-wrap gap-2 w-full">
                {table.availableColumns ? (
                  table.availableColumns.map((column) => {
                    const isSelected = Boolean(
                      values.columns.find((col: any) => col.name === column.name)
                    )

                    return (
                      <div
                        key={column.name}
                        className={[
                          'px-2 py-1 rounded cursor-pointer transition',
                          `${isSelected ? 'bg-brand-300' : 'bg-surface-300 hover:bg-selection'}`,
                        ].join(' ')}
                        onClick={() => {
                          if (isSelected) {
                            setFieldValue(
                              'columns',
                              values.columns.filter((col: any) => col.name !== column.name)
                            )
                          } else {
                            setFieldValue('columns', values.columns.concat([column]))
                          }
                        }}
                      >
                        <p className="text-sm">{column.name}</p>
                      </div>
                    )
                  })
                ) : (
                  <WrapperDynamicColumns
                    initialColumns={values.columns}
                    onChange={(columns) => {
                      setFieldValue('columns', columns)
                    }}
                    errors={errors}
                  />
                )}
              </div>
              {errors.columns && (
                <span className="text-red-900 text-sm mt-2">{errors.columns}</span>
              )}
            </div>

            {optionalOptions.map((option) => (
              <Option key={option.name} option={option} />
            ))}
          </div>
        )
      }}
    </Form>
  )
}

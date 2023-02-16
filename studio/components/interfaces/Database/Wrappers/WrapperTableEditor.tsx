import { useEffect, useState } from 'react'
import { Form, IconDatabase, Input, Listbox, SidePanel, Modal, IconPlus } from 'ui'
import { useStore } from 'hooks'
import { Table, TableOption } from './Wrappers.types'
import { makeValidateRequired } from './Wrappers.utils'
import ActionBar from 'components/interfaces/TableGridEditor/SidePanelEditor/ActionBar'

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
        <div className="mt-4 space-y-6">
          <Listbox
            label="Select a target the table will point to"
            value={selectedTableIndex}
            onChange={(value) => setSelectedTableIndex(value)}
          >
            <Listbox.Option key="empty" value="" label="---">
              ---
            </Listbox.Option>

            {tables.map((table, i) => {
              return (
                <Listbox.Option
                  className="group"
                  key={String(i)}
                  value={String(i)}
                  label={table.label}
                >
                  <div className="space-y-1">
                    <p>{table.label}</p>
                    <p className="opacity-50">{table.description}</p>
                  </div>
                </Listbox.Option>
              )
            })}
          </Listbox>

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
  const { meta } = useStore()
  const schemas = meta.schemas.list()

  const requiredOptions =
    table.options.filter((option) => option.editable && option.required && !option.defaultValue) ??
    []
  const optionalOptions =
    table.options.filter(
      (option) => option.editable && (!option.required || option.defaultValue)
    ) ?? []

  const initialValues = initialData ?? {
    table_name: '',
    columns: table.availableColumns.map((column) => column.name),
    ...Object.fromEntries(table.options.map((option) => [option.name, option.defaultValue ?? ''])),
    schema: 'public',
    schema_name: '',
  }

  const validate = makeValidateRequired([
    ...table.options,
    { name: 'table_name', required: true },
    { name: 'columns', required: true },
  ])

  return (
    <Form
      id="wrapper-table-editor-form"
      initialValues={initialValues}
      validate={validate}
      onSubmit={onSubmit}
      enableReinitialize={true}
    >
      {({ errors, values, resetForm }: any) => {
        return (
          <div className="space-y-4">
            <Listbox size="small" name="schema" label="Select a schema for the foreign table">
              <Listbox.Option
                key="custom"
                id="custom"
                label={`Create a new schema`}
                value="custom"
                addOnBefore={() => <IconPlus size={16} strokeWidth={1.5} />}
              >
                Create a new schema
              </Listbox.Option>
              <Modal.Separator />
              {/* @ts-ignore */}
              {schemas.map((schema: PostgresSchema) => {
                return (
                  <Listbox.Option
                    key={schema.id}
                    id={schema.name}
                    label={schema.name}
                    value={schema.name}
                    addOnBefore={() => <IconDatabase size={16} strokeWidth={1.5} />}
                  >
                    {schema.name}
                  </Listbox.Option>
                )
              })}
            </Listbox>
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
              <label className="!w-full">Select the columns to be added to your table</label>
              <div className="flex flex-wrap gap-2">
                {table.availableColumns.map((column) => {
                  const isSelected = values.columns.includes(column.name)
                  return (
                    <div
                      key={column.name}
                      className={[
                        'px-2 py-1 bg-scale-500 rounded cursor-pointer transition',
                        `${isSelected ? 'bg-brand-800' : 'hover:bg-scale-700'}`,
                      ].join(' ')}
                      onClick={() => {
                        if (isSelected) {
                          resetForm({
                            values: {
                              ...values,
                              columns: values.columns.filter((x: string) => x !== column.name),
                            },
                          })
                        } else {
                          resetForm({
                            values: { ...values, columns: values.columns.concat([column.name]) },
                          })
                        }
                      }}
                    >
                      <p className="text-sm">{column.name}</p>
                    </div>
                  )
                })}
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

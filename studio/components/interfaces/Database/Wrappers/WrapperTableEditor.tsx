import ActionBar from 'components/interfaces/TableGridEditor/SidePanelEditor/ActionBar'
import { useEffect, useState } from 'react'
import { Accordion, Checkbox, Form, Input, Listbox, SidePanel } from 'ui'
import { Table, TableOption } from './types'
import { makeValidateRequired } from './utils'

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
    onSave({ ...values, index: parseInt(selectedTableIndex) })
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
                <Listbox.Option key={String(i)} value={String(i)} label={table.label}>
                  <div className="flex items-center gap-2">{table.label}</div>
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
      className="input-mono"
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
  const requiredOptions =
    table.options.filter((option) => option.editable && option.required && !option.defaultValue) ??
    []
  const optionalOptions =
    table.options.filter(
      (option) => option.editable && (!option.required || option.defaultValue)
    ) ?? []

  const initialValues = initialData ?? {
    table_name: '',
    columns: [],
    ...Object.fromEntries(table.options.map((option) => [option.name, option.defaultValue ?? ''])),
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
      {({ errors, touched, values }: any) => (
        <div className="space-y-4">
          <Input
            id="table_name"
            name="table_name"
            label="Table name"
            descriptionText="The name of the local table table you will query after the wrapper is enabled."
            className="input-mono"
          />

          {requiredOptions.map((option) => (
            <Option key={option.name} option={option} />
          ))}

          <div className="space-y-2">
            <label className="block text-sm break-all text-scale-1100">Columns</label>

            <div>
              {table.availableColumns.map((column, k) => (
                <Checkbox
                  key={k}
                  id={column.name}
                  name="columns"
                  value={column.name}
                  checked={values.columns.includes(column.name)}
                  label={`${column.name} (${column.type})`}
                />
              ))}
            </div>

            {touched.columns && errors.columns && (
              <p className="text-sm text-red-900 transition-all data-show:mt-2 data-show:animate-slide-down-normal data-hide:animate-slide-up-normal">
                {errors.columns}
              </p>
            )}
          </div>

          {optionalOptions.length > 0 && (
            <Accordion
              className="text-sm"
              justified={false}
              openBehaviour="multiple"
              type="default"
              chevronAlign="left"
              size="small"
              bordered={false}
              iconPosition="left"
            >
              <Accordion.Item id="1" header="Optional Fields">
                {optionalOptions.map((option) => (
                  <Option key={option.name} option={option} />
                ))}
              </Accordion.Item>
            </Accordion>
          )}
        </div>
      )}
    </Form>
  )
}

import ActionBar from 'components/interfaces/TableGridEditor/SidePanelEditor/ActionBar'
import { useState } from 'react'
import { Checkbox, Input, Listbox, SidePanel, Accordion, Form } from 'ui'
import { TableOption, Table } from './types'

export type WrapperTableEditorProps = {
  visible: boolean
  onCancel: () => void
  onSave: (values: any) => void

  tables: Table[]
}

const WrapperTableEditor = ({ visible, onCancel, onSave, tables }: WrapperTableEditorProps) => {
  const [selectedTableIndex, setSelectedTableIndex] = useState<string>('')

  const selectedTable = selectedTableIndex === '' ? undefined : tables[parseInt(selectedTableIndex)]

  const onSubmit = (values: any) => {
    onSave(values)
  }

  return (
    <SidePanel
      key="WrapperTableEditor"
      size="medium"
      visible={visible}
      onCancel={onCancel}
      header={<span>Edit foreign table</span>}
      customFooter={
        <ActionBar
          backButtonLabel="Cancel"
          applyButtonLabel="Save"
          formId="wrapper-table-editor-form"
          closePanel={onCancel}
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

          {selectedTable && <TableForm table={selectedTable} onSubmit={onSubmit} />}
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
      required={option.required ?? false}
    />
  )
}

const TableForm = ({ table, onSubmit }: { table: Table; onSubmit: (values: any) => void }) => {
  const requiredOptions =
    table.options.filter((option) => option.editable && option.required && !option.defaultValue) ??
    []
  const optionalOptions =
    table.options.filter(
      (option) => option.editable && (!option.required || option.defaultValue)
    ) ?? []

  const initialValues = Object.fromEntries(
    [
      ['table_name', ''],
      ['columns', []],
    ].concat(table.options.map((option) => [option.name, option.defaultValue ?? '']))
  )

  return (
    <Form
      id="wrapper-table-editor-form"
      initialValues={initialValues}
      //  validate={validate}
      onSubmit={onSubmit}
    >
      {() => (
        <div className="space-y-4">
          <Input
            id="table-name"
            name="table_name"
            label="Table name"
            descriptionText="The name of the local table table you will query after the wrapper is enabled."
            required
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
                  label={`${column.name} (${column.type})`}
                />
              ))}
            </div>
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

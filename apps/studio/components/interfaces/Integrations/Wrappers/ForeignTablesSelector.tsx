import { Edit, Trash } from 'lucide-react'
import { useState } from 'react'
import { Button, cn } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import type { Table } from './Wrappers.types'
import { FormattedWrapperTable, NewTable } from './Wrappers.utils'
import { WrapperTableEditor } from './WrapperTableEditor'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

interface ForeignTablesSelectorProps {
  tables: FormattedWrapperTable[]
  wrapperTables: Table[]
  errorMessage?: string
  onAppend: (values: FormattedWrapperTable) => void
  onUpdate: (index: number, values: FormattedWrapperTable) => void
  onRemove: (index: number) => void
}

export const ForeignTablesSelector = ({
  tables,
  wrapperTables,
  errorMessage,
  onAppend,
  onUpdate,
  onRemove,
}: ForeignTablesSelectorProps) => {
  const [selectedTableToEdit, setSelectedTableToEdit] = useState<FormattedWrapperTable | undefined>(
    undefined
  )
  const [selectedTableFieldIndex, setSelectedTableFieldIndex] = useState<number | undefined>(
    undefined
  )

  const onCancelTableEdit = () => {
    setSelectedTableToEdit(undefined)
    setSelectedTableFieldIndex(undefined)
  }

  const onSaveTable = (values: FormattedWrapperTable) => {
    if (selectedTableFieldIndex !== undefined) {
      onUpdate(selectedTableFieldIndex, values)
    } else {
      onAppend(values)
    }
    onCancelTableEdit()
  }

  return (
    <>
      <FormItemLayout
        isReactForm={false}
        layout="horizontal"
        label="Foreign tables"
        labelOptional="You can query your data from these foreign tables after the wrapper is created"
        className={cn(
          '[&>div>span]:text-balance',
          tables.length === 0 &&
            '[&>div:last-child]:flex [&>div:last-child]:items-center [&>div:last-child]:justify-end'
        )}
      >
        <div className="flex flex-col gap-y-2">
          {tables.map((table, tableIndex) => (
            <div
              key={`${table.schema_name}.${table.table_name}-${tableIndex}`}
              className="flex items-center justify-between px-4 py-2 border rounded-md border-control"
            >
              <div>
                <p className="text-sm">
                  {table.schema_name}.{table.table_name}
                </p>
                <p className="text-sm text-foreground-light">
                  Columns: {(table.columns ?? []).map((column) => column.name).join(', ')}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <ButtonTooltip
                  icon={<Edit />}
                  onClick={() => {
                    setSelectedTableFieldIndex(tableIndex)
                    setSelectedTableToEdit(table)
                  }}
                  tooltip={{ content: { side: 'bottom', text: 'Edit foreign table' } }}
                />
                <ButtonTooltip
                  icon={<Trash />}
                  onClick={() => onRemove(tableIndex)}
                  tooltip={{ content: { side: 'bottom', text: 'Remove foreign table' } }}
                />
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <Button
              onClick={() => {
                setSelectedTableFieldIndex(undefined)
                setSelectedTableToEdit(NewTable)
              }}
            >
              Add foreign table
            </Button>
          </div>

          {tables.length === 0 && errorMessage && (
            <p className="text-sm text-right text-red-900">{errorMessage}</p>
          )}
        </div>
      </FormItemLayout>

      <WrapperTableEditor
        visible={selectedTableToEdit != null}
        tables={wrapperTables}
        onCancel={onCancelTableEdit}
        onSave={onSaveTable}
        initialData={selectedTableToEdit}
      />
    </>
  )
}

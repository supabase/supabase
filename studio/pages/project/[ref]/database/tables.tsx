import { NextPage } from 'next'
import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { isUndefined } from 'lodash'
import { PostgresColumn, PostgresTable } from '@supabase/postgres-meta'

import { withAuth, useStore } from 'hooks'

import { DatabaseLayout } from 'components/layouts'
import { TableList, ColumnList } from 'components/interfaces/Database'
import { SidePanelEditor } from 'components/interfaces/TableGridEditor'

const DatabaseTables: NextPage = () => {
  const { meta } = useStore()
  const tables = meta.tables.list()

  const [selectedTable, setSelectedTable] = useState<any>()
  const [sidePanelKey, setSidePanelKey] = useState<'column' | 'table'>()
  const [selectedColumnToEdit, setSelectedColumnToEdit] = useState<PostgresColumn>()
  const [selectedTableToEdit, setSelectedTableToEdit] = useState<PostgresTable>()

  const onAddTable = () => {
    setSidePanelKey('table')
    setSelectedTableToEdit(undefined)
  }

  const onEditTable = (table: PostgresTable) => {
    setSidePanelKey('table')
    setSelectedTableToEdit(table)
  }

  const onAddColumn = () => {
    setSidePanelKey('column')
    setSelectedColumnToEdit(undefined)
  }

  const onEditColumn = (column: PostgresColumn) => {
    setSidePanelKey('column')
    setSelectedColumnToEdit(column)
  }

  const onColumnUpdated = async () => {
    const updatedTable = await meta.tables.loadById(selectedTable.id)
    setSelectedTable(updatedTable)
  }

  const onClosePanel = () => setSidePanelKey(undefined)

  return (
    <DatabaseLayout title="Database">
      <div className="p-4">
        {isUndefined(selectedTable) ? (
          <TableList
            onAddTable={onAddTable}
            onEditTable={onEditTable}
            onOpenTable={setSelectedTable}
          />
        ) : (
          <ColumnList
            selectedTable={selectedTable}
            onAddColumn={onAddColumn}
            onEditColumn={onEditColumn}
            onSelectBack={() => setSelectedTable(undefined)}
            onColumnDeleted={onColumnUpdated}
          />
        )}
      </div>
      <SidePanelEditor
        sidePanelKey={sidePanelKey}
        selectedSchema="public"
        selectedTable={selectedTable}
        onColumnSaved={onColumnUpdated}
        closePanel={onClosePanel}
        selectedColumnToEdit={selectedColumnToEdit}
        selectedTableToEdit={selectedTableToEdit}
      />
    </DatabaseLayout>
  )
}

export default withAuth(observer(DatabaseTables))

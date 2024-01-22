import { useParams } from 'common'
import { useState } from 'react'

import { ColumnList, TableList } from 'components/interfaces/Database'
import { SidePanelEditor } from 'components/interfaces/TableGridEditor'
import DeleteConfirmationDialogs from 'components/interfaces/TableGridEditor/DeleteConfirmationDialogs'
import { DatabaseLayout } from 'components/layouts'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { Table } from 'data/tables/table-query'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { NextPageWithLayout } from 'types'

const DatabaseTables: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()

  const snap = useTableEditorStateSnapshot()
  const [selectedTable, setSelectedTable] = useState<Table>()

  // [Joshen] Separate state required to handle edit/delete table
  // since selectedTable above handles the state for ColumnList
  const [selectedTableToEdit, setSelectedTableToEdit] = useState<Table>()

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            {selectedTable === undefined ? (
              <TableList
                onAddTable={snap.onAddTable}
                onEditTable={(table) => {
                  setSelectedTableToEdit(table)
                  snap.onEditTable()
                }}
                onDeleteTable={(table) => {
                  setSelectedTableToEdit(table)
                  snap.onDeleteTable()
                }}
                onOpenTable={setSelectedTable}
              />
            ) : (
              <ColumnList
                table={selectedTable}
                onAddColumn={snap.onAddColumn}
                onEditColumn={snap.onEditColumn}
                onDeleteColumn={snap.onDeleteColumn}
                onSelectBack={() => setSelectedTable(undefined)}
              />
            )}
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>

      <DeleteConfirmationDialogs
        includeColumns
        projectRef={projectRef}
        selectedTable={selectedTableToEdit}
      />
      <SidePanelEditor includeColumns selectedTable={selectedTable || selectedTableToEdit} />
    </>
  )
}

DatabaseTables.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default DatabaseTables

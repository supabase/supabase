import type { PostgresTable } from '@supabase/postgres-meta'
import { useMemo, useState } from 'react'

import { TableList } from 'components/interfaces/Database'
import { SidePanelEditor } from 'components/interfaces/TableGridEditor'
import DeleteConfirmationDialogs from 'components/interfaces/TableGridEditor/DeleteConfirmationDialogs'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import type { NextPageWithLayout } from 'types'
import { TableEditorTableStateContextProvider } from 'state/table-editor-table'
import { useParams } from 'common'
import { parseSupaTable } from 'components/grid/SupabaseGrid.utils'

const DatabaseTables: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const snap = useTableEditorStateSnapshot()
  const [selectedTableToEdit, setSelectedTableToEdit] = useState<PostgresTable>()

  // to do - @alaister - this is a temporary solution to get the table editor to work
  const parsedTable = useMemo(() => {
    return parseSupaTable(selectedTableToEdit)
  }, [selectedTableToEdit])

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            <FormHeader title="Database Tables" />
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
              onDuplicateTable={(table) => {
                setSelectedTableToEdit(table)
                snap.onDuplicateTable()
              }}
            />
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>

      {selectedTableToEdit && projectRef && (
        <TableEditorTableStateContextProvider
          key={`table-editor-table-${selectedTableToEdit.id}`}
          projectRef={projectRef}
          table={parsedTable}
          editable={true}
        >
          <DeleteConfirmationDialogs selectedTable={selectedTableToEdit} />
          <DeleteConfirmationDialogs selectedTable={selectedTableToEdit} />
        </TableEditorTableStateContextProvider>
      )}

      <SidePanelEditor includeColumns selectedTable={selectedTableToEdit} />
    </>
  )
}

DatabaseTables.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseTables

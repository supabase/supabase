import { PostgresTable } from '@supabase/postgres-meta'
import { useState } from 'react'

import { useParams } from 'common'
import { TableList } from 'components/interfaces/Database/Tables/TableList'
import { SidePanelEditor } from 'components/interfaces/TableGridEditor'
import DeleteConfirmationDialogs from 'components/interfaces/TableGridEditor/DeleteConfirmationDialogs'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { Entity, isTableLike, postgresTableToEntity } from 'data/table-editor/table-editor-types'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { TableEditorTableStateContextProvider } from 'state/table-editor-table'
import type { NextPageWithLayout } from 'types'

const DatabaseTables: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const snap = useTableEditorStateSnapshot()
  const [selectedTableToEdit, setSelectedTableToEdit] = useState<Entity>()

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            <FormHeader title="Database Tables" />
            <TableList
              onAddTable={snap.onAddTable}
              onEditTable={(table) => {
                setSelectedTableToEdit(postgresTableToEntity(table))
                snap.onEditTable()
              }}
              onDeleteTable={(table) => {
                setSelectedTableToEdit(postgresTableToEntity(table))
                snap.onDeleteTable()
              }}
              onDuplicateTable={(table) => {
                setSelectedTableToEdit(postgresTableToEntity(table))
                snap.onDuplicateTable()
              }}
            />
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>

      {projectRef !== undefined &&
        selectedTableToEdit !== undefined &&
        isTableLike(selectedTableToEdit) && (
          <TableEditorTableStateContextProvider
            key={`table-editor-table-${selectedTableToEdit.id}`}
            projectRef={projectRef}
            table={selectedTableToEdit}
          >
            <DeleteConfirmationDialogs selectedTable={selectedTableToEdit} />
          </TableEditorTableStateContextProvider>
        )}

      <SidePanelEditor includeColumns selectedTable={selectedTableToEdit as PostgresTable} />
    </>
  )
}

DatabaseTables.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseTables

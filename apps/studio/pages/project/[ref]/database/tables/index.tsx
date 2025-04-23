import type { PostgresTable } from '@supabase/postgres-meta'
import { useParams } from 'common'
import { useState } from 'react'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'

import { TableList } from 'components/interfaces/Database'
import { SidePanelEditor } from 'components/interfaces/TableGridEditor'
import DeleteConfirmationDialogs from 'components/interfaces/TableGridEditor/DeleteConfirmationDialogs'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { Entity } from 'data/table-editor/table-editor-types'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { TableEditorTableStateContextProvider } from 'state/table-editor-table'
import type { NextPageWithLayout } from 'types'

const DatabaseTables: NextPageWithLayout = () => {
  const snap = useTableEditorStateSnapshot()
  const { ref: projectRef = '' } = useParams()
  const [selectedTableToEdit, setSelectedTableToEdit] = useState<PostgresTable>()

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

      {selectedTableToEdit && (
        <TableEditorTableStateContextProvider
          projectRef={projectRef}
          table={{
            ...selectedTableToEdit,
            entity_type: ENTITY_TYPE.TABLE,
            relationships: selectedTableToEdit.relationships || [],
          }}
          editable={true}
        >
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

import { useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'
import { TableList } from 'components/interfaces/Database'
import { SidePanelEditor } from 'components/interfaces/TableGridEditor'
import DeleteConfirmationDialogs from 'components/interfaces/TableGridEditor/DeleteConfirmationDialogs'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import type { Table } from 'data/tables/table-query'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import type { NextPageWithLayout } from 'types'

const DatabaseTables: NextPageWithLayout = () => {
  const queryClient = useQueryClient()
  const snap = useTableEditorStateSnapshot()
  const [selectedTableToEdit, setSelectedTableToEdit] = useState<Table>()

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12 space-x-2">
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
            />
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>

      <DeleteConfirmationDialogs selectedTable={selectedTableToEdit} />
      <SidePanelEditor includeColumns selectedTable={selectedTableToEdit} />
    </>
  )
}

DatabaseTables.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default DatabaseTables

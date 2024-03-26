import type { PostgresTable } from '@supabase/postgres-meta'

import { useParams } from 'common'
import { ColumnList } from 'components/interfaces/Database'
import { SidePanelEditor } from 'components/interfaces/TableGridEditor'
import DeleteConfirmationDialogs from 'components/interfaces/TableGridEditor/DeleteConfirmationDialogs'
import { DatabaseLayout } from 'components/layouts'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import useTable from 'hooks/misc/useTable'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import type { NextPageWithLayout } from 'types'

const DatabaseTables: NextPageWithLayout = () => {
  const { id } = useParams()
  const snap = useTableEditorStateSnapshot()
  const { data: selectedTable } = useTable(Number(id))

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            <ColumnList
              onAddColumn={snap.onAddColumn}
              onEditColumn={snap.onEditColumn}
              onDeleteColumn={snap.onDeleteColumn}
            />
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>

      <DeleteConfirmationDialogs selectedTable={selectedTable} />
      <SidePanelEditor includeColumns selectedTable={selectedTable as PostgresTable} />
    </>
  )
}

DatabaseTables.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default DatabaseTables

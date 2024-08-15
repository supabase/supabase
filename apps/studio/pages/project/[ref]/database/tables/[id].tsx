import type { PostgresTable } from '@supabase/postgres-meta'

import { useParams } from 'common'
import { ColumnList } from 'components/interfaces/Database'
import { SidePanelEditor } from 'components/interfaces/TableGridEditor'
import DeleteConfirmationDialogs from 'components/interfaces/TableGridEditor/DeleteConfirmationDialogs'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import useTable from 'hooks/misc/useTable'
import { ChevronRight } from 'lucide-react'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import type { NextPageWithLayout } from 'types'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'

const DatabaseTables: NextPageWithLayout = () => {
  const { id } = useParams()
  const snap = useTableEditorStateSnapshot()
  const { data: selectedTable, isLoading } = useTable(Number(id))

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12 space-y-6">
            <div className="flex items-center space-x-2">
              <FormHeader className="!mb-0" title="Database Tables" />
              <ChevronRight size={18} strokeWidth={1.5} className="text-foreground-light" />
              {isLoading ? (
                <ShimmeringLoader className="w-40" />
              ) : (
                <FormHeader className="!mb-0" title={selectedTable?.name ?? ''} />
              )}
            </div>
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

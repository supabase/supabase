import { useParams } from 'common'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { ColumnList } from '@/components/interfaces/Database/Tables/ColumnList'
import DeleteConfirmationDialogs from '@/components/interfaces/TableGridEditor/DeleteConfirmationDialogs'
import { SidePanelEditor } from '@/components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor'
import DatabaseLayout from '@/components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import { PageLayout } from '@/components/layouts/PageLayout/PageLayout'
import { useTableEditorQuery } from '@/data/table-editor/table-editor-query'
import { isTableLike } from '@/data/table-editor/table-editor-types'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTableEditorStateSnapshot } from '@/state/table-editor'
import { TableEditorTableStateContextProvider } from '@/state/table-editor-table'
import type { NextPageWithLayout } from '@/types'

const DatabaseTables: NextPageWithLayout = () => {
  const snap = useTableEditorStateSnapshot()

  const { id: _id, ref } = useParams()
  const id = _id ? Number(_id) : undefined

  const { data: project } = useSelectedProjectQuery()
  const { data: selectedTable, isPending: isLoading } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })

  return (
    <>
      <PageLayout
        title={isLoading ? <ShimmeringLoader className="w-40" /> : (selectedTable?.name ?? '')}
        breadcrumbs={[
          {
            label: 'Tables',
            href: `/project/${ref}/database/tables`,
          },
        ]}
        size="large"
      >
        <PageContainer size="large">
          <PageSection>
            <PageSectionContent>
              <ColumnList
                onAddColumn={snap.onAddColumn}
                onEditColumn={snap.onEditColumn}
                onDeleteColumn={snap.onDeleteColumn}
              />
            </PageSectionContent>
          </PageSection>
        </PageContainer>
      </PageLayout>

      {project?.ref !== undefined && selectedTable !== undefined && isTableLike(selectedTable) && (
        <TableEditorTableStateContextProvider
          key={`table-editor-table-${selectedTable.id}`}
          projectRef={project?.ref}
          table={selectedTable}
        >
          <DeleteConfirmationDialogs selectedTable={selectedTable} />
          <SidePanelEditor includeColumns selectedTable={selectedTable} />
        </TableEditorTableStateContextProvider>
      )}
    </>
  )
}

DatabaseTables.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Tables">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseTables

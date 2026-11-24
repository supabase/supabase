import { createFileRoute, Link } from '@tanstack/react-router'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from 'ui'
import { PageBreadcrumbs } from 'ui-patterns/PageBreadcrumbs'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { ColumnList } from '@/components/interfaces/Database/Tables/ColumnList'
import { DeleteConfirmationDialogs } from '@/components/interfaces/TableGridEditor/DeleteConfirmationDialogs'
import { SidePanelEditor } from '@/components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor'
import { useTableEditorQuery } from '@/data/table-editor/table-editor-query'
import { isTableLike } from '@/data/table-editor/table-editor-types'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTableEditorStateSnapshot } from '@/state/table-editor'
import { TableEditorTableStateContextProvider } from '@/state/table-editor-table'

export const Route = createFileRoute('/project/$ref/database/tables/$id')({
  component: DatabaseTables,
  staticData: {
    databaseLayoutTitle: 'Tables',
  },
})

function DatabaseTables() {
  const snap = useTableEditorStateSnapshot()

  const { id: idParam, ref } = Route.useParams()
  const id = Number(idParam)

  const { data: project } = useSelectedProjectQuery()
  const { data: selectedTable, isPending: isLoading } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })

  return (
    <>
      <PageBreadcrumbs>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/project/$ref/database/tables" params={{ ref }}>
                Tables
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </PageBreadcrumbs>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>
              {isLoading ? <ShimmeringLoader className="w-40" /> : (selectedTable?.name ?? '')}
            </PageHeaderTitle>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
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

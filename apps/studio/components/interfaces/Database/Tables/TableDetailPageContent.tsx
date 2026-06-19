import { useParams } from 'common'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { useSnapshot } from 'valtio'

import { ColumnList } from './ColumnList'
import { TableDetailOverview } from './TableDetailOverview'
import { warehouseDemoStore } from '@/components/interfaces/Database/Warehouse/warehouseDemoStore'
import { WarehouseSyncChip } from '@/components/interfaces/Database/Warehouse/WarehouseSyncChip'
import { WarehouseTableStoragePanel } from '@/components/interfaces/Database/Warehouse/WarehouseTableStoragePanel'
import DeleteConfirmationDialogs from '@/components/interfaces/TableGridEditor/DeleteConfirmationDialogs'
import { SidePanelEditor } from '@/components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor'
import { PageLayout } from '@/components/layouts/PageLayout/PageLayout'
import { useDatabasePublicationsQuery } from '@/data/database-publications/database-publications-query'
import { useTableEditorQuery } from '@/data/table-editor/table-editor-query'
import { isTableLike } from '@/data/table-editor/table-editor-types'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTableEditorStateSnapshot } from '@/state/table-editor'
import { TableEditorTableStateContextProvider } from '@/state/table-editor-table'

export function TableDetailPageContent() {
  const snap = useTableEditorStateSnapshot()
  const { id: _id, ref } = useParams()
  const id = _id ? Number(_id) : undefined

  const { data: project } = useSelectedProjectQuery()
  const { data: selectedTable, isPending: isLoading } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })

  const { data: publications } = useDatabasePublicationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const realtimePublication = (publications ?? []).find(
    (publication) => publication.name === 'supabase_realtime'
  )
  const realtimeEnabled =
    selectedTable?.id !== undefined &&
    (realtimePublication?.tables ?? []).some((table) => table.id === selectedTable.id)

  const warehouseSnap = useSnapshot(warehouseDemoStore)
  const tableKey =
    selectedTable?.schema !== undefined && selectedTable?.name !== undefined
      ? `${selectedTable.schema}.${selectedTable.name}`
      : undefined
  const warehouseState = tableKey ? warehouseSnap.tables[tableKey] : undefined
  const storageSyncError = warehouseState?.syncState === 'error'

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
        <PageContainer size="large" className="flex flex-col gap-8">
          {selectedTable !== undefined && !isLoading && (
            <TableDetailOverview entity={selectedTable} realtimeEnabled={realtimeEnabled} />
          )}

          {tableKey && selectedTable !== undefined && isTableLike(selectedTable) && (
            <PageSection>
              <PageSectionMeta>
                <PageSectionSummary>
                  <div className="flex items-center gap-2">
                    <PageSectionTitle>Storage</PageSectionTitle>
                    {storageSyncError && <WarehouseSyncChip syncState="error" />}
                  </div>
                </PageSectionSummary>
              </PageSectionMeta>
              <PageSectionContent>
                <WarehouseTableStoragePanel tableKey={tableKey} postgresSize={selectedTable.size} />
              </PageSectionContent>
            </PageSection>
          )}

          <PageSection>
            <PageSectionMeta>
              <PageSectionSummary>
                <PageSectionTitle>Columns</PageSectionTitle>
              </PageSectionSummary>
            </PageSectionMeta>
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
          projectRef={project.ref}
          table={selectedTable}
        >
          <DeleteConfirmationDialogs selectedTable={selectedTable} />
          <SidePanelEditor includeColumns selectedTable={selectedTable} />
        </TableEditorTableStateContextProvider>
      )}
    </>
  )
}

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { TableEditor } from 'icons'
import { Check, Edit, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { type PropsWithChildren } from 'react'
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  Button,
  NavMenu,
  NavMenuItem,
} from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderBreadcrumb,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderNavigationTabs,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { useSnapshot } from 'valtio'

import DatabaseLayout from './DatabaseLayout'
import { buildTableEditorUrl } from '@/components/grid/SupabaseGrid.utils'
import {
  getWarehouseStorageSummaryLabel,
  warehouseDemoStore,
} from '@/components/interfaces/Database/Warehouse/warehouseDemoStore'
import { WarehouseSyncChip } from '@/components/interfaces/Database/Warehouse/WarehouseSyncChip'
import DeleteConfirmationDialogs from '@/components/interfaces/TableGridEditor/DeleteConfirmationDialogs'
import { SidePanelEditor } from '@/components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor'
import { EntityTypeIcon } from '@/components/ui/EntityTypeIcon'
import { useDatabasePublicationsQuery } from '@/data/database-publications/database-publications-query'
import { useTableEditorQuery } from '@/data/table-editor/table-editor-query'
import { isTableLike } from '@/data/table-editor/table-editor-types'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTableEditorStateSnapshot } from '@/state/table-editor'
import { TableEditorTableStateContextProvider } from '@/state/table-editor-table'

export type TableDetailSection = 'overview' | 'columns' | 'policies' | 'settings'

interface TableDetailLayoutProps {
  section: TableDetailSection
}

export function TableDetailLayout({
  section: _section,
  children,
}: PropsWithChildren<TableDetailLayoutProps>) {
  const router = useRouter()
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

  const { can: canUpdateTables } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'tables'
  )

  const isTable = selectedTable !== undefined && isTableLike(selectedTable)
  const showPoliciesTab = isTable
  const showSettingsTab = isTable
  const storageSyncError = warehouseState?.syncState === 'error'
  const hasWarehouseStorage = warehouseState?.mode === 'has_warehouse_copy'
  const tableSizeLabel =
    isTable && selectedTable.size !== undefined
      ? (getWarehouseStorageSummaryLabel(warehouseState, selectedTable.size) ?? selectedTable.size)
      : isTable
        ? getWarehouseStorageSummaryLabel(warehouseState, selectedTable.size)
        : null

  const tableEditorUrl =
    selectedTable !== undefined
      ? buildTableEditorUrl({
          projectRef: ref,
          tableId: selectedTable.id,
          schema: selectedTable.schema,
        })
      : undefined

  const navigationItems = id
    ? [
        {
          label: 'Overview',
          href: `/project/${ref}/database/tables/${id}`,
        },
        {
          label: 'Columns',
          href: `/project/${ref}/database/tables/${id}/columns`,
        },
        ...(showPoliciesTab
          ? [
              {
                label: 'Policies',
                href: `/project/${ref}/database/tables/${id}/policies`,
              },
            ]
          : []),
        ...(showSettingsTab
          ? [
              {
                label: 'Settings',
                href: `/project/${ref}/database/tables/${id}/settings`,
              },
            ]
          : []),
      ]
    : []

  return (
    <DatabaseLayout title="Tables">
      <div className="flex min-h-full w-full flex-col items-stretch">
        <PageHeader size="full" className="sticky top-0 z-10 bg-surface-75">
          <PageHeaderBreadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/project/${ref}/database/tables`}>Tables</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {selectedTable && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <span>{selectedTable.name}</span>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </PageHeaderBreadcrumb>

          <PageHeaderMeta className="mb-4">
            <PageHeaderSummary>
              <div className="flex items-center gap-2">
                {selectedTable && <EntityTypeIcon type={selectedTable.entity_type} />}
                <PageHeaderTitle>
                  {isLoading ? <ShimmeringLoader className="w-40" /> : (selectedTable?.name ?? '')}
                </PageHeaderTitle>
                {storageSyncError && <WarehouseSyncChip syncState="error" />}
              </div>

              {selectedTable && !isLoading && (
                <PageHeaderDescription className="flex flex-col gap-1 text-sm!">
                  <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-1 text-foreground-light">
                    <code className="text-code-inline">{selectedTable.schema}</code>
                    {isTable && selectedTable.live_rows_estimate !== undefined && (
                      <span>{selectedTable.live_rows_estimate.toLocaleString()} rows</span>
                    )}
                    {tableSizeLabel && <span>{tableSizeLabel}</span>}
                    {isTable && (
                      <span className="inline-flex items-center gap-1">
                        RLS
                        {selectedTable.rls_enabled ? (
                          <Check size={14} className="text-brand-link" />
                        ) : (
                          <X size={14} className="text-foreground-muted" />
                        )}
                      </span>
                    )}
                    {isTable && (
                      <span className="inline-flex items-center gap-1">
                        Realtime
                        {realtimeEnabled ? (
                          <Check size={14} className="text-brand-link" />
                        ) : (
                          <X size={14} className="text-foreground-muted" />
                        )}
                      </span>
                    )}
                    {isTable && hasWarehouseStorage && (
                      <span className="inline-flex items-center gap-1">
                        Warehouse
                        <Check size={14} className="text-brand-link" />
                      </span>
                    )}
                  </div>
                </PageHeaderDescription>
              )}
            </PageHeaderSummary>

            {isTable && tableEditorUrl && (
              <PageHeaderAside>
                <div className="flex items-center gap-2">
                  {canUpdateTables && (
                    <Button variant="default" icon={<Edit />} onClick={() => snap.onEditTable()}>
                      Edit
                    </Button>
                  )}
                  <Button
                    variant="default"
                    icon={<TableEditor size={16} strokeWidth={1.5} />}
                    asChild
                  >
                    <Link href={tableEditorUrl}>View</Link>
                  </Button>
                </div>
              </PageHeaderAside>
            )}
          </PageHeaderMeta>

          {navigationItems.length > 1 && (
            <PageHeaderNavigationTabs>
              <NavMenu>
                {navigationItems.map((item) => {
                  const isActive = router.asPath.split('?')[0] === item.href
                  return (
                    <NavMenuItem key={item.label} active={isActive}>
                      <Link href={item.href}>{item.label}</Link>
                    </NavMenuItem>
                  )
                })}
              </NavMenu>
            </PageHeaderNavigationTabs>
          )}
        </PageHeader>

        <PageContainer size={_section === 'settings' ? 'small' : 'large'} className="py-8">
          {children}
        </PageContainer>
      </div>

      {project?.ref !== undefined && selectedTable !== undefined && isTable && (
        <TableEditorTableStateContextProvider
          key={`table-editor-table-${selectedTable.id}`}
          projectRef={project.ref}
          table={selectedTable}
        >
          <DeleteConfirmationDialogs
            selectedTable={selectedTable}
            onTableDeleted={() => {
              router.push(`/project/${ref}/database/tables`)
            }}
          />
          <SidePanelEditor includeColumns selectedTable={selectedTable} />
        </TableEditorTableStateContextProvider>
      )}
    </DatabaseLayout>
  )
}

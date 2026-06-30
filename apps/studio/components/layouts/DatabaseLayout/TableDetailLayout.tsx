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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
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
  resolveWarehouseTableState,
  warehouseDemoStore,
} from '@/components/interfaces/Database/Warehouse/warehouseDemoStore'
import {
  getSourceSchemaName,
  getSourceTableKey,
  getWarehouseSchemaName,
} from '@/components/interfaces/Database/Warehouse/warehouseNaming.utils'
import { WarehouseSyncChip } from '@/components/interfaces/Database/Warehouse/WarehouseSyncChip'
import {
  buildTableDetailUrl,
  formatWarehouseLagLabel,
  WAREHOUSE_TABLE_DETAIL_VIEW,
  type TableDetailSection,
} from '@/components/interfaces/Database/Warehouse/warehouseTableEditor.utils'
import DeleteConfirmationDialogs from '@/components/interfaces/TableGridEditor/DeleteConfirmationDialogs'
import { SidePanelEditor } from '@/components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor'
import { EntityTypeIcon } from '@/components/ui/EntityTypeIcon'
import { useDatabasePublicationsQuery } from '@/data/database-publications/database-publications-query'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import { useTableEditorQuery } from '@/data/table-editor/table-editor-query'
import { isTableLike } from '@/data/table-editor/table-editor-types'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTableDetailWarehouseView } from '@/hooks/misc/useTableDetailWarehouseView'
import { useTableEditorStateSnapshot } from '@/state/table-editor'
import { TableEditorTableStateContextProvider } from '@/state/table-editor-table'

export type { TableDetailSection } from '@/components/interfaces/Database/Warehouse/warehouseTableEditor.utils'

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

  const { isWarehouseDetailView } = useTableDetailWarehouseView(selectedTable?.schema)

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
      ? getSourceTableKey(selectedTable.schema, selectedTable.name)
      : undefined
  const warehouseState = tableKey
    ? resolveWarehouseTableState(tableKey, warehouseSnap.tables[tableKey] ?? { mode: 'postgres' }, {
        isWarehouseView: isWarehouseDetailView,
      })
    : undefined

  const { can: canUpdateTables } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'tables'
  )

  const isTable = selectedTable !== undefined && isTableLike(selectedTable)
  const headerEntityType = isWarehouseDetailView
    ? ENTITY_TYPE.WAREHOUSE_TABLE
    : selectedTable?.entity_type
  const displaySchema =
    selectedTable !== undefined && isWarehouseDetailView
      ? getWarehouseSchemaName(getSourceSchemaName(selectedTable.schema))
      : selectedTable?.schema
  const showPoliciesTab = isTable && !isWarehouseDetailView
  const showSettingsTab = isTable && !isWarehouseDetailView
  const storageSyncError = warehouseState?.syncState === 'error'
  const hasWarehouseStorage = warehouseState?.mode === 'has_warehouse_copy'
  const tableSizeLabel =
    isWarehouseDetailView && isTable
      ? (selectedTable.size ??
        (warehouseState?.warehouseSizeBytes !== undefined
          ? getWarehouseStorageSummaryLabel(warehouseState, undefined)?.split(' · ').pop()
          : undefined))
      : isTable && selectedTable.size !== undefined
        ? (getWarehouseStorageSummaryLabel(warehouseState, selectedTable.size) ??
          selectedTable.size)
        : isTable
          ? getWarehouseStorageSummaryLabel(warehouseState, selectedTable.size)
          : null

  const warehouseEditorSchema =
    selectedTable !== undefined && isWarehouseDetailView
      ? getWarehouseSchemaName(getSourceSchemaName(selectedTable.schema))
      : undefined

  const tableEditorUrl =
    selectedTable !== undefined
      ? buildTableEditorUrl({
          projectRef: ref,
          tableId: selectedTable.id,
          schema: warehouseEditorSchema ?? selectedTable.schema,
        })
      : undefined

  const navigationItems =
    id && ref
      ? isWarehouseDetailView
        ? [
            {
              label: 'Overview',
              href: buildTableDetailUrl(ref, id, {
                view: WAREHOUSE_TABLE_DETAIL_VIEW,
                section: 'overview',
              }),
            },
            {
              label: 'Storage',
              href: buildTableDetailUrl(ref, id, {
                view: WAREHOUSE_TABLE_DETAIL_VIEW,
                section: 'storage',
              }),
            },
          ]
        : [
            {
              label: 'Overview',
              href: buildTableDetailUrl(ref, id, { section: 'overview' }),
            },
            {
              label: 'Columns',
              href: buildTableDetailUrl(ref, id, { section: 'columns' }),
            },
            ...(showPoliciesTab
              ? [
                  {
                    label: 'Policies',
                    href: buildTableDetailUrl(ref, id, { section: 'policies' }),
                  },
                ]
              : []),
            ...(showSettingsTab
              ? [
                  {
                    label: 'Settings',
                    href: buildTableDetailUrl(ref, id, { section: 'settings' }),
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
                {selectedTable && headerEntityType && isWarehouseDetailView ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex shrink-0">
                        <EntityTypeIcon type={headerEntityType} />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Warehouse copy</TooltipContent>
                  </Tooltip>
                ) : (
                  selectedTable && headerEntityType && <EntityTypeIcon type={headerEntityType} />
                )}
                <PageHeaderTitle>
                  {isLoading ? <ShimmeringLoader className="w-40" /> : (selectedTable?.name ?? '')}
                </PageHeaderTitle>
                {storageSyncError && <WarehouseSyncChip syncState="error" />}
                {isWarehouseDetailView && warehouseState?.syncState === 'live' && (
                  <WarehouseSyncChip syncState="live" />
                )}
              </div>

              {selectedTable && !isLoading && (
                <PageHeaderDescription className="flex flex-col gap-1 text-sm!">
                  <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-1 text-foreground-light">
                    <code className="text-code-inline">{displaySchema}</code>
                    {isTable && selectedTable.live_rows_estimate !== undefined && (
                      <span>{selectedTable.live_rows_estimate.toLocaleString()} rows</span>
                    )}
                    {tableSizeLabel && <span>{tableSizeLabel}</span>}
                    {isWarehouseDetailView && warehouseState?.lagSeconds !== undefined && (
                      <span>{formatWarehouseLagLabel(warehouseState.lagSeconds)}</span>
                    )}
                    {isTable && !isWarehouseDetailView && (
                      <span className="inline-flex items-center gap-1">
                        RLS
                        {selectedTable.rls_enabled ? (
                          <Check size={14} className="text-brand-link" />
                        ) : (
                          <X size={14} className="text-foreground-muted" />
                        )}
                      </span>
                    )}
                    {isTable && !isWarehouseDetailView && (
                      <span className="inline-flex items-center gap-1">
                        Realtime
                        {realtimeEnabled ? (
                          <Check size={14} className="text-brand-link" />
                        ) : (
                          <X size={14} className="text-foreground-muted" />
                        )}
                      </span>
                    )}
                    {isTable && !isWarehouseDetailView && hasWarehouseStorage && (
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
                  {!isWarehouseDetailView && canUpdateTables && (
                    <Button variant="default" icon={<Edit />} onClick={() => snap.onEditTable()}>
                      Edit
                    </Button>
                  )}
                  <Button
                    variant="default"
                    icon={<TableEditor size={16} strokeWidth={1.5} />}
                    asChild
                  >
                    <Link href={tableEditorUrl}>
                      {isWarehouseDetailView ? 'View in Table Editor' : 'View'}
                    </Link>
                  </Button>
                </div>
              </PageHeaderAside>
            )}
          </PageHeaderMeta>

          {navigationItems.length > 1 && (
            <PageHeaderNavigationTabs>
              <NavMenu>
                {navigationItems.map((item) => {
                  const isActive = router.asPath.split('?')[0] === item.href.split('?')[0]
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

        <PageContainer
          size={
            _section === 'settings' && !isWarehouseDetailView
              ? 'small'
              : _section === 'storage' && isWarehouseDetailView
                ? 'small'
                : 'large'
          }
          className="py-8"
        >
          {children}
        </PageContainer>
      </div>

      {project?.ref !== undefined &&
        selectedTable !== undefined &&
        isTable &&
        !isWarehouseDetailView && (
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

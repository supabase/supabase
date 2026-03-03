import { useParams } from 'common'
import { Copy, Download, Edit, Globe, Lock, MoreVertical, Trash } from 'lucide-react'
import Link from 'next/link'
import { type CSSProperties } from 'react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  cn,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TreeViewItemVariant,
} from 'ui'

import { useExportAllRowsAsCsv, useExportAllRowsAsSql } from './ExportAllRows'
import { useTableFilter } from '@/components/grid/hooks/useTableFilter'
import { buildTableEditorUrl } from '@/components/grid/SupabaseGrid.utils'
import { getEntityLintDetails } from '@/components/interfaces/TableGridEditor/TableEntity.utils'
import { EntityTypeIcon } from '@/components/ui/EntityTypeIcon'
import { InlineLink } from '@/components/ui/InlineLink'
import { getTableDefinition } from '@/data/database/table-definition-query'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import { Entity } from '@/data/entity-types/entity-types-infinite-query'
import { useProjectLintsQuery } from '@/data/lint/lint-query'
import { EditorTablePageLink } from '@/data/prefetchers/project.$ref.editor.$id'
import type {
  TableApiAccessData,
  TableApiAccessMap,
} from '@/data/privileges/table-api-access-query'
import { useTableRowsCountQuery } from '@/data/table-rows/table-rows-count-query'
import { useQuerySchemaState } from '@/hooks/misc/useSchemaQueryState'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { formatSql } from '@/lib/formatSql'
import {
  useRoleImpersonationStateSnapshot,
  type RoleImpersonationState,
} from '@/state/role-impersonation-state'
import { useTableEditorStateSnapshot } from '@/state/table-editor'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

export interface EntityListItemProps {
  id: number | string
  projectRef: string
  item: Entity
  isLocked: boolean
  isActive?: boolean
  style?: CSSProperties
  onExportCLI: () => void
  apiAccessMap?: TableApiAccessMap
}

// [jordi] Used to determine the entity is a table and not a view or other unsupported entity type
function isTableLikeEntityListItem(entity: { type?: string }) {
  return entity?.type === ENTITY_TYPE.TABLE || entity?.type === ENTITY_TYPE.PARTITIONED_TABLE
}

export const EntityListItem = ({
  id,
  projectRef,
  item: entity,
  isLocked,
  isActive: _isActive,
  style,
  onExportCLI,
  apiAccessMap,
}: EntityListItemProps) => {
  const { data: project } = useSelectedProjectQuery()
  const snap = useTableEditorStateSnapshot()
  const { selectedSchema } = useQuerySchemaState()

  const tabId = createTabId(entity.type, { id: entity.id })
  const tabs = useTabsStateSnapshot()
  const isPreview = tabs.previewTabId === tabId

  const isActive = Number(id) === entity.id
  const canEdit = isActive && !isLocked

  const { filters } = useTableFilter()
  const roleImpersonationState = useRoleImpersonationStateSnapshot()
  const { data: countData } = useTableRowsCountQuery(
    {
      projectRef,
      connectionString: project?.connectionString,
      tableId: entity.id,
      filters,
      enforceExactCount: false,
      roleImpersonationState: roleImpersonationState as RoleImpersonationState,
    },
    {
      enabled: isTableLikeEntityListItem(entity) && isActive,
    }
  )
  const rowCount = countData?.count

  const { data: lints = [] } = useProjectLintsQuery({
    projectRef: project?.ref,
  })

  const tableHasRlsDisabledLint: boolean = getEntityLintDetails(
    entity.name,
    'rls_disabled_in_public',
    ['ERROR'],
    lints,
    selectedSchema
  ).hasLint

  const tableHasRlsEnabledNoPolicyLint: boolean = getEntityLintDetails(
    entity.name,
    'rls_enabled_no_policy',
    ['ERROR', 'WARN', 'INFO'],
    lints,
    selectedSchema
  ).hasLint

  const viewHasLints: boolean = getEntityLintDetails(
    entity.name,
    'security_definer_view',
    ['ERROR', 'WARN'],
    lints,
    selectedSchema
  ).hasLint

  const materializedViewHasLints: boolean = getEntityLintDetails(
    entity.name,
    'materialized_view_in_api',
    ['ERROR', 'WARN'],
    lints,
    selectedSchema
  ).hasLint

  const foreignTableHasLints: boolean = getEntityLintDetails(
    entity.name,
    'foreign_table_in_api',
    ['ERROR', 'WARN'],
    lints,
    selectedSchema
  ).hasLint

  const apiAccessData = apiAccessMap?.[entity.name]

  const formatTooltipText = (entityType: string) => {
    const text =
      Object.entries(ENTITY_TYPE)
        .find(([, value]) => value === entityType)?.[0]
        ?.toLowerCase()
        ?.split('_')
        ?.join(' ') || ''
    // Return sentence case (capitalize first letter only)
    return text.charAt(0).toUpperCase() + text.slice(1)
  }

  const { exportCsv, confirmationModal: exportCsvConfirmationModal } = useExportAllRowsAsCsv({
    enabled: true,
    projectRef,
    connectionString: project?.connectionString ?? null,
    entity,
    type: 'fetch_all',
    totalRows: rowCount,
  })

  const { exportSql, confirmationModal: exportSqlConfirmationModal } = useExportAllRowsAsSql({
    enabled: true,
    projectRef,
    connectionString: project?.connectionString ?? null,
    entity,
    type: 'fetch_all',
    totalRows: rowCount,
  })

  return (
    <EditorTablePageLink
      title={entity.name}
      style={style}
      id={String(entity.id)}
      href={buildTableEditorUrl({ projectRef, tableId: entity.id, schema: entity.schema })}
      role="button"
      aria-label={`View ${entity.name}`}
      className={cn(
        TreeViewItemVariant({
          isSelected: isActive && !isPreview,
          isPreview,
        }),
        'pl-4 pr-1'
      )}
      onDoubleClick={(e) => {
        e.preventDefault()
        const tabId = createTabId(entity.type, { id: entity.id })
        tabs.makeTabPermanent(tabId)
      }}
    >
      <>
        {isActive && <div className="absolute left-0 h-full w-0.5 bg-foreground" />}
        <Tooltip disableHoverableContent={true}>
          <TooltipTrigger className="min-w-4">
            <EntityTypeIcon type={entity.type} isActive={isActive} />
          </TooltipTrigger>
          <TooltipContent side="bottom">{formatTooltipText(entity.type)}</TooltipContent>
        </Tooltip>
        <div
          className={cn(
            'truncate overflow-hidden text-ellipsis whitespace-nowrap flex items-center gap-2 relative w-full',
            isActive && 'text-foreground'
          )}
        >
          <span
            className={cn(
              isActive ? 'text-foreground' : 'text-foreground-light group-hover:text-foreground',
              'text-sm transition truncate'
            )}
          >
            {entity.name}
          </span>
          <EntityTooltipTrigger
            entity={entity}
            tableHasRlsDisabledLint={tableHasRlsDisabledLint}
            tableHasRlsEnabledNoPolicyLint={tableHasRlsEnabledNoPolicyLint}
            viewHasLints={viewHasLints}
            materializedViewHasLints={materializedViewHasLints}
            foreignTableHasLints={foreignTableHasLints}
            apiAccessData={apiAccessData}
          />
        </div>

        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              className="text-foreground-lighter transition-all text-transparent group-hover:text-foreground data-[state=open]:text-foreground"
            >
              <Button
                type="text"
                className="w-6 h-6"
                icon={<MoreVertical size={14} strokeWidth={2} />}
                onClick={(e) => e.preventDefault()}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start" className="w-44">
              <DropdownMenuItem
                key="copy-name"
                className="space-x-2"
                onClick={(e) => {
                  e.stopPropagation()
                  copyToClipboard(entity.name)
                }}
              >
                <Copy size={12} />
                <span>Copy name</span>
              </DropdownMenuItem>

              {isTableLikeEntityListItem(entity) && (
                <DropdownMenuItem
                  key="copy-schema"
                  className="space-x-2"
                  onClick={async (e) => {
                    e.stopPropagation()
                    const toastId = toast.loading('Getting table schema...')

                    const formattedSchema = getTableDefinition({
                      id: entity.id,
                      projectRef: project?.ref,
                      connectionString: project?.connectionString,
                    }).then((tableDefinition) => {
                      if (!tableDefinition) {
                        throw new Error('Failed to get table schema')
                      }
                      return formatSql(tableDefinition)
                    })

                    try {
                      await copyToClipboard(formattedSchema, () => {
                        toast.success('Table schema copied to clipboard', { id: toastId })
                      })
                    } catch (err: any) {
                      toast.error('Failed to copy schema: ' + (err.message || err), { id: toastId })
                    }
                  }}
                >
                  <Copy size={12} />
                  <span>Copy table schema</span>
                </DropdownMenuItem>
              )}

              {entity.type === ENTITY_TYPE.TABLE && (
                <>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    key="edit-table"
                    className="space-x-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      snap.onEditTable()
                    }}
                  >
                    <Edit size={12} />
                    <span>Edit table</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    key="duplicate-table"
                    className="space-x-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      snap.onDuplicateTable()
                    }}
                  >
                    <Copy size={12} />
                    <span>Duplicate table</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem key="view-policies" className="space-x-2" asChild>
                    <Link
                      key="view-policies"
                      href={`/project/${projectRef}/auth/policies?schema=${selectedSchema}&search=${entity.id}`}
                    >
                      <Lock size={12} />
                      <span>View policies</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-x-2">
                      <Download size={12} />
                      Export data
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem
                        key="download-table-csv"
                        className="space-x-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          exportCsv()
                        }}
                      >
                        <span>Export table as CSV</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        key="download-table-sql"
                        className="gap-x-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          exportSql()
                        }}
                      >
                        <span>Export table as SQL</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        key="download-table-cli"
                        className="gap-x-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          onExportCLI()
                        }}
                      >
                        <span>Export table via CLI</span>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    key="delete-table"
                    className="gap-x-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      snap.onDeleteTable()
                    }}
                  >
                    <Trash size={12} />
                    <span>Delete table</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </>
      {exportCsvConfirmationModal}
      {exportSqlConfirmationModal}
    </EditorTablePageLink>
  )
}

const EntityTooltipTrigger = ({
  entity,
  tableHasRlsDisabledLint,
  tableHasRlsEnabledNoPolicyLint,
  viewHasLints,
  materializedViewHasLints,
  foreignTableHasLints,
  apiAccessData,
}: {
  entity: Entity
  tableHasRlsDisabledLint: boolean
  tableHasRlsEnabledNoPolicyLint: boolean
  viewHasLints: boolean
  materializedViewHasLints: boolean
  foreignTableHasLints: boolean
  apiAccessData?: TableApiAccessData
}) => {
  const { ref } = useParams()

  let tooltipContent = null
  const accessWarning = 'Data is publicly accessible via API'
  const learnMoreCTA = (
    <InlineLink
      href={`/project/${ref}/editor/${entity.id}?schema=${entity.schema}&showWarning=true`}
    >
      Learn more
    </InlineLink>
  )

  switch (entity.type) {
    case ENTITY_TYPE.TABLE:
      if (tableHasRlsDisabledLint) {
        tooltipContent = (
          <>
            This table can be accessed by anyone via the Data API as RLS is disabled. {learnMoreCTA}
            .
          </>
        )
      }
      break
    case ENTITY_TYPE.VIEW:
      if (viewHasLints) {
        tooltipContent = (
          <>
            {accessWarning} as this is a Security definer view. {learnMoreCTA}.
          </>
        )
      }
      break
    case ENTITY_TYPE.MATERIALIZED_VIEW:
      if (materializedViewHasLints) {
        tooltipContent = (
          <>
            {accessWarning} as this is a Security definer view {learnMoreCTA}.
          </>
        )
      }
      break
    case ENTITY_TYPE.FOREIGN_TABLE:
      if (foreignTableHasLints) {
        tooltipContent = (
          <>
            {accessWarning} as RLS is not enforced on foreign tables. {learnMoreCTA}.
          </>
        )
      }
      break
    default:
      break
  }

  if (tooltipContent) {
    return (
      <Tooltip>
        <TooltipTrigger className="min-w-4">
          <Badge variant="destructive">Unrestricted</Badge>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-52">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    )
  }

  const isRlsEnabledNoPolicies =
    entity.type === ENTITY_TYPE.TABLE &&
    apiAccessData?.apiAccessType === 'access' &&
    tableHasRlsEnabledNoPolicyLint
  if (isRlsEnabledNoPolicies) {
    return (
      <Tooltip>
        <TooltipTrigger className="min-w-4" aria-label="Table exposed via Data API">
          <Globe size={14} strokeWidth={1} className="text-foreground-lighter" />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-52">
          This table can be accessed via the Data API but no RLS policies exist so no data will be
          returned
        </TooltipContent>
      </Tooltip>
    )
  }

  const isApiExposedWithRlsAndPolicies =
    apiAccessData?.apiAccessType === 'access' && !tableHasRlsEnabledNoPolicyLint
  if (isApiExposedWithRlsAndPolicies) {
    return (
      <Tooltip>
        <TooltipTrigger className="min-w-4" aria-label="Table exposed via Data API">
          <Globe size={14} strokeWidth={1} className="text-foreground-lighter" />
        </TooltipTrigger>
        <TooltipContent side="right">This table can be accessed via the Data API</TooltipContent>
      </Tooltip>
    )
  }

  return null
}

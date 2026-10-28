import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { useOpenEntityQuery } from '../hooks'
import { AddRowButton } from './AddRowButton'
import type { DatabaseObjectDetailsProps } from './DatabaseObjectDetails'
import {
  formatPolicySummary,
  formatTriggerSummary,
  getTableRelationships,
  type TableRelationship,
} from './Details.utils'
import {
  DetailsAction,
  DetailsAddLink,
  DetailsEmpty,
  DetailsList,
  DetailsListItem,
  DetailsProperties,
  DetailsProperty,
  DetailsSection,
} from './DetailsSection'
import { RelationDetailsHeader } from './RelationDetailsHeader'
import { RLSToggleDialog } from '@/components/interfaces/Database/RLSToggleDialog'
import { RealtimeToggleDialog } from '@/components/interfaces/TableGridEditor/RealtimeToggleDialog'
import { getTablePoliciesUrl } from '@/components/interfaces/TableGridEditor/TableEntity.utils'
import { useIndexesQuery } from '@/data/database-indexes/indexes-query'
import { useDatabasePoliciesQuery } from '@/data/database-policies/database-policies-query'
import { useIsTableRealtimeEnabled } from '@/data/database-publications/database-publications-query'
import { useDatabaseTriggersQuery } from '@/data/database-triggers/database-triggers-query'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import type { QueryRelation } from '@/data/sql/query-relations-query'
import { useTableEditorQuery } from '@/data/table-editor/table-editor-query'
import { isTableLike, type TableLike } from '@/data/table-editor/table-editor-types'
import { useTableRowsCountQuery } from '@/data/table-rows/table-rows-count-query'
import { useTableUpdateMutation } from '@/data/tables/table-update-mutation'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useIsProtectedSchema } from '@/hooks/useProtectedSchemas'
import { useTrack } from '@/lib/telemetry/track'

/** What a table query sits on top of: its size, access rules, and the objects around it. */
export const TableDetails = ({ relation, onRowAdded }: DatabaseObjectDetailsProps) => {
  const { data: project } = useSelectedProjectQuery()
  const projectRef = project?.ref
  const connectionString = project?.connectionString

  const { data: entity, isPending } = useTableEditorQuery({
    projectRef,
    connectionString,
    id: relation.id,
  })
  const table = isTableLike(entity) ? entity : undefined
  // A Supabase-managed schema such as `auth` isn't changed from here, and isn't exposed to API
  // roles the way the API-role policy hint assumes.
  const { isSchemaLocked } = useIsProtectedSchema({ schema: relation.schema })

  if (isPending) {
    return (
      <div className="flex flex-col">
        <RelationDetailsHeader relation={relation} />
        <div className="flex flex-col gap-y-3 px-4 pb-4">
          <ShimmeringLoader className="py-2" />
          <ShimmeringLoader className="w-3/4 py-2" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <RelationDetailsHeader
        relation={relation}
        description={entity?.comment}
        action={table && <AddRowButton relation={relation} onRowAdded={onRowAdded} />}
      />
      {table && <TableProperties relation={relation} table={table} />}
      <TablePolicies
        relation={relation}
        isRlsEnabled={table?.rls_enabled ?? false}
        isSchemaLocked={isSchemaLocked}
      />
      <TableTriggers relation={relation} isSchemaLocked={isSchemaLocked} />
      <TableIndexes relation={relation} isSchemaLocked={isSchemaLocked} />
      {table && (
        <TableRelationships relationships={getTableRelationships(table.relationships, relation)} />
      )}
    </div>
  )
}

export const TableProperties = ({
  relation,
  table,
}: {
  relation: QueryRelation
  table: TableLike
}) => {
  const track = useTrack()
  const { data: project } = useSelectedProjectQuery()
  const [isRlsDialogOpen, setIsRlsDialogOpen] = useState(false)
  const [isRealtimeDialogOpen, setIsRealtimeDialogOpen] = useState(false)

  const { data: rowCount } = useTableRowsCountQuery({
    projectRef: project?.ref,
    tableId: relation.id,
  })
  const isRealtimeEnabled = useIsTableRealtimeEnabled({ id: relation.id })
  const { realtimeAll: isRealtimeAvailable } = useIsFeatureEnabled(['realtime:all'])
  const { isSchemaLocked } = useIsProtectedSchema({ schema: relation.schema })
  const { can: canWriteDatabase } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.DATABASE_WRITE
  )
  const canChangeTable = canWriteDatabase && !isSchemaLocked

  const { mutateAsync: updateTable, isPending: isUpdatingTable } = useTableUpdateMutation({
    onError: (error) => toast.error(`Failed to enable RLS: ${error.message}`),
  })

  const handleEnableRls = async () => {
    if (!project) return
    await updateTable({
      projectRef: project.ref,
      connectionString: project.connectionString,
      id: relation.id,
      name: relation.name,
      schema: relation.schema,
      payload: { id: relation.id, rls_enabled: true },
    })
    track('table_rls_enabled', {
      method: 'explorer',
      schema_name: relation.schema,
      table_name: relation.name,
    })
  }

  const primaryKey = table.primary_keys.map(({ name }) => name)

  return (
    <>
      <DetailsSection title="Properties">
        <DetailsProperties>
          <DetailsProperty label="Rows">
            {rowCount?.count === undefined
              ? '–'
              : `${rowCount.is_estimate ? '~' : ''}${rowCount.count.toLocaleString()}`}
          </DetailsProperty>
          <DetailsProperty label="Size">{table.size}</DetailsProperty>
          <DetailsProperty label="Primary key">
            <span className="truncate font-mono">
              {primaryKey.length > 0 ? primaryKey.join(', ') : 'None'}
            </span>
          </DetailsProperty>
          <DetailsProperty label="RLS">
            <span className={table.rls_enabled ? undefined : 'text-warning'}>
              {table.rls_enabled ? 'Enabled' : 'Disabled'}
            </span>
            {!table.rls_enabled && canChangeTable && (
              <DetailsAction onClick={() => setIsRlsDialogOpen(true)}>Enable</DetailsAction>
            )}
          </DetailsProperty>
          {isRealtimeAvailable && (
            <DetailsProperty label="Realtime">
              <span>{isRealtimeEnabled ? 'Enabled' : 'Disabled'}</span>
              {canChangeTable && (
                <DetailsAction onClick={() => setIsRealtimeDialogOpen(true)}>
                  {isRealtimeEnabled ? 'Disable' : 'Enable'}
                </DetailsAction>
              )}
            </DetailsProperty>
          )}
        </DetailsProperties>
      </DetailsSection>

      <RLSToggleDialog
        open={isRlsDialogOpen}
        tableName={relation.name}
        isEnabled={table.rls_enabled}
        isSubmitting={isUpdatingTable}
        onOpenChange={setIsRlsDialogOpen}
        onConfirm={handleEnableRls}
      />
      <RealtimeToggleDialog
        table={table}
        open={isRealtimeDialogOpen}
        setOpen={setIsRealtimeDialogOpen}
      />
    </>
  )
}

export const TablePolicies = ({
  relation,
  isRlsEnabled,
  isSchemaLocked,
}: {
  relation: QueryRelation
  isRlsEnabled: boolean
  isSchemaLocked: boolean
}) => {
  const { data: project } = useSelectedProjectQuery()
  const { data, isPending, isError } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schemas: [relation.schema],
  })
  const policies = (data ?? []).filter(({ table_id }) => table_id === relation.id)
  const policiesUrl = getTablePoliciesUrl(project?.ref, relation.schema, relation.name)

  return (
    <DetailsSection
      title="Policies"
      count={isPending ? undefined : policies.length}
      action={isSchemaLocked ? undefined : <DetailsAddLink href={policiesUrl} label="Add policy" />}
    >
      {isPending && <ShimmeringLoader className="py-2" />}
      {isError && <DetailsEmpty>Couldn't load policies</DetailsEmpty>}
      {!isPending && !isError && policies.length === 0 && (
        <DetailsEmpty>
          {isRlsEnabled && !isSchemaLocked
            ? "No policies yet. API roles can't read or write rows until you add one."
            : 'No policies'}
        </DetailsEmpty>
      )}
      {policies.length > 0 && (
        <DetailsList>
          {policies.map((policy) => (
            <DetailsListItem
              key={policy.id}
              title={policy.name}
              description={formatPolicySummary(policy)}
            />
          ))}
        </DetailsList>
      )}
    </DetailsSection>
  )
}

export const TableTriggers = ({
  relation,
  isSchemaLocked,
}: {
  relation: QueryRelation
  isSchemaLocked: boolean
}) => {
  const { data: project } = useSelectedProjectQuery()
  const { data, isPending, isError } = useDatabaseTriggersQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const triggers = (data ?? []).filter(({ table_id }) => table_id === relation.id)
  const createTriggerUrl = `/project/${project?.ref ?? ''}/database/triggers/data?schema=${encodeURIComponent(relation.schema)}&new=true`

  return (
    <DetailsSection
      title="Triggers"
      count={isPending ? undefined : triggers.length}
      action={
        isSchemaLocked ? undefined : <DetailsAddLink href={createTriggerUrl} label="Add trigger" />
      }
    >
      {isPending && <ShimmeringLoader className="py-2" />}
      {isError && <DetailsEmpty>Couldn't load triggers</DetailsEmpty>}
      {!isPending && !isError && triggers.length === 0 && <DetailsEmpty>No triggers</DetailsEmpty>}
      {triggers.length > 0 && (
        <DetailsList>
          {triggers.map((trigger) => (
            <DetailsListItem
              key={trigger.id}
              title={trigger.name}
              description={formatTriggerSummary(trigger)}
              className={trigger.enabled_mode === 'DISABLED' ? 'opacity-50' : undefined}
            />
          ))}
        </DetailsList>
      )}
    </DetailsSection>
  )
}

const TableIndexes = ({
  relation,
  isSchemaLocked,
}: {
  relation: QueryRelation
  isSchemaLocked: boolean
}) => {
  const { data: project } = useSelectedProjectQuery()
  const { data, isPending, isError } = useIndexesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: relation.schema,
  })
  const indexes = (data ?? []).filter(({ table }) => table === relation.name)
  const createIndexUrl = `/project/${project?.ref ?? ''}/database/indexes?schema=${encodeURIComponent(relation.schema)}&new=true`

  return (
    <DetailsSection
      title="Indexes"
      count={isPending ? undefined : indexes.length}
      defaultOpen={false}
      action={
        isSchemaLocked ? undefined : <DetailsAddLink href={createIndexUrl} label="Add index" />
      }
    >
      {isPending && <ShimmeringLoader className="py-2" />}
      {isError && <DetailsEmpty>Couldn't load indexes</DetailsEmpty>}
      {!isPending && !isError && indexes.length === 0 && <DetailsEmpty>No indexes</DetailsEmpty>}
      {indexes.length > 0 && (
        <DetailsList>
          {indexes.map((index) => (
            <DetailsListItem
              key={index.name}
              title={index.name}
              description={<span className="font-mono">{index.columns}</span>}
            />
          ))}
        </DetailsList>
      )}
    </DetailsSection>
  )
}

const TableRelationships = ({
  relationships: { references, referencedBy },
}: {
  relationships: { references: TableRelationship[]; referencedBy: TableRelationship[] }
}) => {
  const { openEntityQuery } = useOpenEntityQuery()
  const count = references.length + referencedBy.length

  const renderRelationship = (relationship: TableRelationship, direction: 'to' | 'from') => {
    const Icon = direction === 'to' ? ArrowRightIcon : ArrowLeftIcon
    const via =
      direction === 'to'
        ? `${relationship.columns.join(', ')} → ${relationship.otherColumns.join(', ')}`
        : `${relationship.otherColumns.join(', ')} → ${relationship.columns.join(', ')}`
    return (
      <li
        key={`${direction}:${relationship.table.schema}.${relationship.table.name}:${relationship.constraintName}`}
      >
        <button
          type="button"
          tabIndex={0}
          className="group/relationship flex w-full min-w-0 items-start gap-x-2 text-left"
          onClick={() => openEntityQuery({ ...relationship.table, type: ENTITY_TYPE.TABLE })}
        >
          <Icon
            size={14}
            strokeWidth={2}
            className="mt-0.75 shrink-0 text-foreground-muted"
            aria-label={direction === 'to' ? 'References' : 'Referenced by'}
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-foreground group-hover/relationship:underline">
              {relationship.table.schema}.{relationship.table.name}
            </span>
            <span className="block truncate font-mono text-sm text-foreground-lighter">{via}</span>
          </span>
        </button>
      </li>
    )
  }

  return (
    <DetailsSection title="Relationships" count={count} defaultOpen={count > 0}>
      {count === 0 && <DetailsEmpty>No foreign keys</DetailsEmpty>}
      {count > 0 && (
        <ul className="flex flex-col gap-y-1.5">
          {references.map((relationship) => renderRelationship(relationship, 'to'))}
          {referencedBy.map((relationship) => renderRelationship(relationship, 'from'))}
        </ul>
      )}
    </DetailsSection>
  )
}

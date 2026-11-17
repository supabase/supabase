import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import type { Entity } from '@/data/entity-types/entity-types-infinite-query'

export type EntityActionId =
  | 'copy-name'
  | 'copy-schema'
  | 'copy-definition'
  | 'edit-table'
  | 'duplicate-table'
  | 'view-policies'
  | 'export'
  | 'export-csv'
  | 'export-sql'
  | 'export-cli'
  | 'view-partitions'
  | 'delete'

export type EntityAction = {
  id: EntityActionId
  label: string
  href?: string
  disabledReason?: string
  children?: EntityAction[]
}

export type EntityActionGroup = EntityAction[]

export function isTableLikeEntity(entity: { type?: string }) {
  return entity.type === ENTITY_TYPE.TABLE || entity.type === ENTITY_TYPE.PARTITIONED_TABLE
}

type GetEntityActionsParams = {
  entity: Pick<Entity, 'id' | 'schema' | 'type' | 'is_partition'>
  projectRef: string
  /** Whether the entity is the one currently open in the table editor */
  isActive: boolean
  isLocked: boolean
}

/**
 * Edit, duplicate and delete are applied by the side panel / dialogs mounted for the table that is
 * open in the editor, so they can only target the active entity. Everything else works off the
 * entity itself and is available from any row.
 *
 * This is temporary - we'll look into supporting edit, duplicate and delete from context menu in
 * a separate PR, just that it requires a bit more surgery to decouple those actions from the router
 */
export const getEntityActions = ({
  entity,
  projectRef,
  isActive,
  isLocked,
}: GetEntityActionsParams): EntityActionGroup[] => {
  const isTableLike = isTableLikeEntity(entity)
  const isViewLike =
    entity.type === ENTITY_TYPE.VIEW || entity.type === ENTITY_TYPE.MATERIALIZED_VIEW
  const noun = isViewLike ? 'view' : 'table'
  const getDisabledReason = (verb: string) =>
    isActive ? undefined : `Open this ${noun} to ${verb} it`

  const copyGroup: EntityActionGroup = [{ id: 'copy-name', label: 'Copy name' }]
  if (isTableLike) copyGroup.push({ id: 'copy-schema', label: 'Copy table schema' })
  if (isViewLike) copyGroup.push({ id: 'copy-definition', label: 'Copy definition' })

  const manageGroup: EntityActionGroup = []
  if (isTableLike) {
    const canEditTable = !isLocked && entity.type === ENTITY_TYPE.TABLE && !entity.is_partition
    if (canEditTable) {
      manageGroup.push(
        { id: 'edit-table', label: 'Edit table', disabledReason: getDisabledReason('edit') },
        {
          id: 'duplicate-table',
          label: 'Duplicate table',
          disabledReason: getDisabledReason('duplicate'),
        }
      )
    }
    manageGroup.push({
      id: 'view-policies',
      label: 'View policies',
      href: `/project/${projectRef}/database/policies?schema=${encodeURIComponent(entity.schema)}&search=${encodeURIComponent(String(entity.id))}`,
    })
  }
  if (isTableLike || isViewLike) {
    const exportActions: EntityAction[] = [
      { id: 'export-csv', label: `Export ${noun} as CSV` },
      { id: 'export-sql', label: `Export ${noun} as SQL` },
    ]
    if (isTableLike) exportActions.push({ id: 'export-cli', label: 'Export table via CLI' })
    manageGroup.push({ id: 'export', label: 'Export data', children: exportActions })
  }

  const partitionsGroup: EntityActionGroup =
    entity.type === ENTITY_TYPE.PARTITIONED_TABLE
      ? [{ id: 'view-partitions', label: 'View partitions' }]
      : []

  const deleteGroup: EntityActionGroup =
    !isLocked && (isTableLike || isViewLike)
      ? [{ id: 'delete', label: `Delete ${noun}`, disabledReason: getDisabledReason('delete') }]
      : []

  return [copyGroup, manageGroup, partitionsGroup, deleteGroup].filter((group) => group.length > 0)
}

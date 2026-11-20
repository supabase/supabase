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
  children?: EntityAction[]
}

export type EntityActionGroup = EntityAction[]

export function isTableLikeEntity(entity: { type?: string }) {
  return entity.type === ENTITY_TYPE.TABLE || entity.type === ENTITY_TYPE.PARTITIONED_TABLE
}

type GetEntityActionsParams = {
  entity: Pick<Entity, 'id' | 'schema' | 'type' | 'is_partition'>
  projectRef: string
  isLocked: boolean
}

/**
 * Every action works off the entity itself, including edit, duplicate and delete, which act on the
 * table named in the table editor state. The same list is available from any row.
 */
export const getEntityActions = ({
  entity,
  projectRef,
  isLocked,
}: GetEntityActionsParams): EntityActionGroup[] => {
  const isTableLike = isTableLikeEntity(entity)
  const isViewLike =
    entity.type === ENTITY_TYPE.VIEW || entity.type === ENTITY_TYPE.MATERIALIZED_VIEW
  const noun = isViewLike ? 'view' : 'table'

  const copyGroup: EntityActionGroup = [{ id: 'copy-name', label: 'Copy name' }]
  if (isTableLike) copyGroup.push({ id: 'copy-schema', label: 'Copy table schema' })
  if (isViewLike) copyGroup.push({ id: 'copy-definition', label: 'Copy definition' })

  const manageGroup: EntityActionGroup = []
  if (isTableLike) {
    const canEditTable = !isLocked && entity.type === ENTITY_TYPE.TABLE && !entity.is_partition
    if (canEditTable) {
      manageGroup.push(
        { id: 'edit-table', label: 'Edit table' },
        { id: 'duplicate-table', label: 'Duplicate table' }
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
    !isLocked && (isTableLike || isViewLike) ? [{ id: 'delete', label: `Delete ${noun}` }] : []

  return [copyGroup, manageGroup, partitionsGroup, deleteGroup].filter((group) => group.length > 0)
}

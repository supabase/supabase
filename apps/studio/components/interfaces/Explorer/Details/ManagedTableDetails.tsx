import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import type { DatabaseObjectDetailsProps } from './DatabaseObjectDetails'
import { RelationDetailsHeader } from './RelationDetailsHeader'
import { TablePolicies, TableProperties } from './TableDetails'
import { useTableEditorQuery } from '@/data/table-editor/table-editor-query'
import { isTableLike } from '@/data/table-editor/table-editor-types'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

/**
 * A table in a schema Supabase manages, such as `storage` or `realtime`: what it is and who
 * can read it, without the add and change actions or the structure a user would only need
 * for tables they own.
 */
export const ManagedTableDetails = ({ relation }: DatabaseObjectDetailsProps) => {
  const { data: project } = useSelectedProjectQuery()
  const { data: entity, isPending } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id: relation.id,
  })
  const table = isTableLike(entity) ? entity : undefined

  return (
    <div className="flex flex-col">
      <RelationDetailsHeader
        relation={relation}
        subtitle={`Managed by Supabase in ${relation.schema}`}
        description={entity?.comment}
      />
      {isPending && <ShimmeringLoader className="mx-4 mb-4 py-2" />}
      {table && <TableProperties relation={relation} table={table} />}
      {table && (
        <TablePolicies relation={relation} isRlsEnabled={table.rls_enabled} isSchemaLocked />
      )}
    </div>
  )
}

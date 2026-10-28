import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { DetailsProperties, DetailsProperty, DetailsSection } from './DetailsSection'
import { RelationDetailsHeader } from './RelationDetailsHeader'
import type { QueryRelation } from '@/data/sql/query-relations-query'
import { useTableEditorQuery } from '@/data/table-editor/table-editor-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

/** Details for a relation that isn't a plain table: a view, materialized view, or foreign table. */
export const RelationDetails = ({ relation }: { relation: QueryRelation }) => {
  const { data: project } = useSelectedProjectQuery()
  const { data: entity, isPending } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id: relation.id,
  })

  return (
    <div className="flex flex-col">
      <RelationDetailsHeader relation={relation} description={entity?.comment} />
      {isPending && <ShimmeringLoader className="mx-4 mb-4 py-2" />}
      {entity && (
        <DetailsSection title="Properties">
          <DetailsProperties>
            <DetailsProperty label="Columns">
              {entity.columns.length.toLocaleString()}
            </DetailsProperty>
            {'foreign_server_name' in entity && (
              <DetailsProperty label="Server">
                <span className="truncate">{entity.foreign_server_name}</span>
              </DetailsProperty>
            )}
            {'foreign_data_wrapper_name' in entity && (
              <DetailsProperty label="Wrapper">
                <span className="truncate">{entity.foreign_data_wrapper_name}</span>
              </DetailsProperty>
            )}
          </DetailsProperties>
        </DetailsSection>
      )}
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { DatabaseObjectDetails } from '../Details/DatabaseObjectDetails'
import { DetailsEmpty } from '../Details/DetailsSection'
import { queryRelationsQueryOptions, type QueryRelation } from '@/data/sql/query-relations-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useGrant } from '@/lib/grants'

/**
 * Side panel describing what a query works with: each table or view it reads or writes. It
 * follows the SQL that produced the results on screen, so the details match the rows being
 * looked at rather than a half-typed edit.
 */
export const QueryDetailsPanel = ({
  sql,
  onRowAdded,
}: {
  /** The SQL whose objects to describe; usually the last one run. */
  sql?: string
  onRowAdded?: (relation: QueryRelation, row: Record<string, unknown>) => void
}) => {
  const { data: project } = useSelectedProjectQuery()
  const queryGrant = useGrant('POST /platform/pg-meta/{ref}/query', { projectRef: project?.ref })
  const {
    data: relations,
    isPending,
    isError,
  } = useQuery(
    queryRelationsQueryOptions({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      sql,
      grant: queryGrant.grant,
    })
  )
  const isDenied = queryGrant.status === 'denied'

  return (
    <aside aria-label="Query details" className="flex h-full flex-col overflow-y-auto">
      <div className="flex flex-col divide-y">
        {(relations ?? []).map((relation) => (
          <DatabaseObjectDetails
            key={relation.id}
            relation={relation}
            onRowAdded={onRowAdded ? (row) => onRowAdded(relation, row) : undefined}
          />
        ))}
        {!sql && (
          <div className="p-4">
            <DetailsEmpty>Run the query to see the tables and views it uses.</DetailsEmpty>
          </div>
        )}
        {!!sql && isDenied && (
          <div className="p-4">
            <DetailsEmpty>
              You need permission to read this project's database to see its details.
            </DetailsEmpty>
          </div>
        )}
        {!!sql && !isDenied && isPending && (
          <div className="flex flex-col gap-y-2 p-4">
            <ShimmeringLoader className="py-2" />
            <ShimmeringLoader className="w-2/3 py-2" />
          </div>
        )}
        {!!sql && isError && (
          <div className="p-4">
            <DetailsEmpty>Couldn't load details for this query.</DetailsEmpty>
          </div>
        )}
        {relations?.length === 0 && (
          <div className="p-4">
            <DetailsEmpty>This query doesn't use any tables or views.</DetailsEmpty>
          </div>
        )}
      </div>
    </aside>
  )
}

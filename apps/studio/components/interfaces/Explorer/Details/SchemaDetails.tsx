import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { useOpenEntityQuery } from '../hooks'
import {
  DetailsEmpty,
  DetailsList,
  DetailsProperties,
  DetailsProperty,
  DetailsSection,
} from './DetailsSection'
import { EntityTypeIcon } from '@/components/ui/EntityTypeIcon'
import { useDatabaseFunctionsQuery } from '@/data/database-functions/database-functions-query'
import { useDatabasePoliciesQuery } from '@/data/database-policies/database-policies-query'
import { useSchemasQuery } from '@/data/database/schemas-query'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import { useTablesQuery } from '@/data/tables/tables-query'
import { useViewsQuery } from '@/data/views/views-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

const POSTGRES_DEFAULT_PUBLIC_COMMENT = 'standard public schema'

const formatCount = (count: number | undefined) =>
  count === undefined ? '–' : count.toLocaleString()

/** What a schema holds, and which of its tables are open to API roles without RLS. */
export const SchemaDetails = ({ schema }: { schema: string }) => {
  const { data: project } = useSelectedProjectQuery()
  const connection = { projectRef: project?.ref, connectionString: project?.connectionString }
  const { openEntityQuery } = useOpenEntityQuery()

  const { data: schemas } = useSchemasQuery(connection)
  const { data: tables, isPending: isLoadingTables } = useTablesQuery({ ...connection, schema })
  const { data: views } = useViewsQuery({ ...connection, schemas: [schema] })
  const { data: functions } = useDatabaseFunctionsQuery({ ...connection, schema })
  const { data: policies } = useDatabasePoliciesQuery({ ...connection, schemas: [schema] })

  const details = schemas?.find(({ name }) => name === schema)
  // Postgres puts this comment on `public` in every database, so it describes nothing.
  const description =
    details?.comment === POSTGRES_DEFAULT_PUBLIC_COMMENT ? undefined : details?.comment
  const tablesWithoutRls = (tables ?? []).filter(({ rls_enabled }) => !rls_enabled)

  return (
    <div className="flex flex-col">
      <header className="flex flex-col gap-y-2 p-4">
        <div className="flex min-w-0 items-start gap-x-2">
          <span className="mt-0.5 shrink-0 text-foreground-lighter">
            <EntityTypeIcon type="schema" size={16} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm text-foreground">{schema}</h3>
            <p className="truncate text-sm text-foreground-lighter">Schema</p>
          </div>
        </div>
        {description && <p className="text-sm text-foreground-light">{description}</p>}
      </header>

      <DetailsSection title="Properties">
        <DetailsProperties>
          <DetailsProperty label="Owner">
            <span className="truncate">{details?.owner ?? '–'}</span>
          </DetailsProperty>
          <DetailsProperty label="Tables">{formatCount(tables?.length)}</DetailsProperty>
          <DetailsProperty label="Views">{formatCount(views?.length)}</DetailsProperty>
          <DetailsProperty label="Functions">{formatCount(functions?.length)}</DetailsProperty>
          <DetailsProperty label="Policies">{formatCount(policies?.length)}</DetailsProperty>
        </DetailsProperties>
      </DetailsSection>

      <DetailsSection
        title="RLS disabled"
        count={isLoadingTables ? undefined : tablesWithoutRls.length}
      >
        {isLoadingTables && <ShimmeringLoader className="py-2" />}
        {!isLoadingTables && tablesWithoutRls.length === 0 && (
          <DetailsEmpty>Every table in this schema has RLS enabled.</DetailsEmpty>
        )}
        {tablesWithoutRls.length > 0 && (
          <DetailsList>
            {tablesWithoutRls.map((table) => (
              <li key={table.id}>
                <button
                  type="button"
                  tabIndex={0}
                  className="truncate text-left text-sm text-foreground hover:underline"
                  onClick={() =>
                    openEntityQuery({ schema, name: table.name, type: ENTITY_TYPE.TABLE })
                  }
                >
                  {table.name}
                </button>
              </li>
            ))}
          </DetailsList>
        )}
      </DetailsSection>
    </div>
  )
}

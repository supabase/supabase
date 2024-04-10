import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useGetIndexesFromSelectQuery } from 'data/database/retrieve-index-from-select-query'
import { GenericSkeletonLoader } from 'ui-patterns'
import { QueryPanelContainer, QueryPanelSection } from './QueryPanel'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useExecuteSqlQuery } from 'data/sql/execute-sql-query'
import { IndexAdvisorDisabledState } from './IndexAdvisorDisabledState'

interface QueryIndexesProps {
  selectedRow: any
}

export const QueryIndexes = ({ selectedRow }: QueryIndexesProps) => {
  const { project } = useProjectContext()

  const { data, isSuccess, isLoading, isError } = useGetIndexesFromSelectQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    query: selectedRow?.['query'],
  })

  const { data: indexAdvisorExt, isLoading: isLoadingIndexAdvisorExt } = useExecuteSqlQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    sql: `select * from pg_proc where proname = 'index_advisor';`,
    queryKey: ['index-advisor-function-check'],
  })
  const { data: extensions, isLoading: isLoadingExtensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const isLoadingChecks = isLoadingIndexAdvisorExt || isLoadingExtensions
  const hypopgExtension = (extensions ?? []).find((ext) => ext.name === 'hypopg')
  const isIndexAdvisorAvailable =
    (indexAdvisorExt?.result ?? []).length > 0 &&
    hypopgExtension !== undefined &&
    hypopgExtension.installed_version !== null

  return (
    <QueryPanelContainer>
      <QueryPanelSection>
        <div>
          <p className="text-sm">Indexes in use</p>
          <p className="text-sm text-foreground-light">This query is using the following indexes</p>
        </div>
        {isLoading && <GenericSkeletonLoader />}
        {isSuccess && (
          <>
            {data.length === 0 && (
              <div className="border rounded border-dashed flex items-center justify-center py-4">
                <p className="text-sm text-foreground-light">
                  No indexes are involved in this query
                </p>
              </div>
            )}
            {data.map((index) => {
              return <div key={index.name}>{index.name}</div>
            })}
          </>
        )}
      </QueryPanelSection>

      <QueryPanelSection>
        <p className="text-sm">Index suggestion</p>
        {isLoadingChecks ? (
          <GenericSkeletonLoader />
        ) : !isIndexAdvisorAvailable ? (
          <IndexAdvisorDisabledState />
        ) : null}
      </QueryPanelSection>
    </QueryPanelContainer>
  )
}

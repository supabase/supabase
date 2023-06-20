import { DatabaseLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useMigrationsQuery } from 'data/database/migrations-query'
import { NextPageWithLayout } from 'types'

const MigrationsPage: NextPageWithLayout = () => {
  const { project } = useProjectContext()
  const { data, isLoading, isSuccess, isError } = useMigrationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  return (
    <div>
      {isLoading && <div>Loading state...</div>}
      {isError && <div>Error state...</div>}
      {isSuccess && (
        <div>
          {data.result.length <= 0 && <div>No migrations state...</div>}

          {data.result.length > 0 &&
            data.result.map((migration) => (
              <div key={migration.version}>
                <div>{migration.version}</div>
                <div>
                  {migration.statements?.map((statement, i) => (
                    <div key={i}>{statement}</div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

MigrationsPage.getLayout = (page) => <DatabaseLayout title="Migrations">{page}</DatabaseLayout>

export default MigrationsPage

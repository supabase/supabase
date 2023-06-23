import clsx from 'clsx'
import Migrations from 'components/interfaces/Database/Migrations/Migrations'
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
    <div
      className={clsx(
        'mx-auto flex flex-col px-5 pt-6 pb-14',
        'lg:pt-8 lg:px-14 1xl:px-28 2xl:px-32 h-full'
      )}
    >
      <Migrations />
    </div>
  )
}

MigrationsPage.getLayout = (page) => <DatabaseLayout title="Migrations">{page}</DatabaseLayout>

export default MigrationsPage

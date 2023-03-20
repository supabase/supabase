import { observer } from 'mobx-react-lite'
import { DatabaseLayout } from 'components/layouts'
import { RolesList } from 'components/interfaces/Database'
import { NextPageWithLayout } from 'types'
import clsx from 'clsx'

const DatabaseRoles: NextPageWithLayout = () => {
  return (
    <div
      className={clsx(
        'mx-auto flex flex-col px-5 pt-6 pb-14',
        'lg:pt-8 lg:px-14 1xl:px-28 2xl:px-32'
      )}
    >
      <RolesList />
    </div>
  )
}

DatabaseRoles.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default observer(DatabaseRoles)

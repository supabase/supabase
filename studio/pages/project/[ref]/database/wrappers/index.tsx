import clsx from 'clsx'
import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { NextPageWithLayout } from 'types'
import { useCheckPermissions } from 'hooks'
import { DatabaseLayout } from 'components/layouts'
import { Wrappers } from 'components/interfaces/Database'
import NoPermission from 'components/ui/NoPermission'

const DatabaseWrappers: NextPageWithLayout = () => {
  const canReadWrappers = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'tables')
  if (!canReadWrappers) {
    return <NoPermission isFullPage resourceText="view foreign data wrappers" />
  }

  return <Wrappers />
}

DatabaseWrappers.getLayout = (page) => (
  <DatabaseLayout title="Wrappers">
    <div
      className={clsx(
        'mx-auto flex flex-col px-5 pt-6 pb-14',
        'lg:pt-8 lg:px-14 1xl:px-28 2xl:px-32 h-full'
      )}
    >
      {page}
    </div>
  </DatabaseLayout>
)

export default observer(DatabaseWrappers)

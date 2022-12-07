import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { NextPageWithLayout } from 'types'
import { checkPermissions } from 'hooks'
import { DatabaseLayout } from 'components/layouts'
import { Wrappers } from 'components/interfaces/Database'
import NoPermission from 'components/ui/NoPermission'

const DatabaseWrappers: NextPageWithLayout = () => {
  const canReadWrappers = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'wrappers')
  if (!canReadWrappers) {
    return <NoPermission isFullPage resourceText="view foreign data wrappers" />
  }

  return <Wrappers />
}

DatabaseWrappers.getLayout = (page) => (
  <DatabaseLayout title="Wrappers">
    <div className="1xl:px-28 mx-auto flex flex-col gap-8 px-5 py-6 lg:px-16 xl:px-24 2xl:px-32 ">
      {page}
    </div>
  </DatabaseLayout>
)

export default observer(DatabaseWrappers)

import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { NextPageWithLayout } from 'types'
import { useCheckPermissions } from 'hooks'
import { DatabaseLayout } from 'components/layouts'
import NoPermission from 'components/ui/NoPermission'
import { CreateWrapper } from 'components/interfaces/Database'

const DatabaseWrappersNew: NextPageWithLayout = () => {
  const canCreateWrappers = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')
  if (!canCreateWrappers) {
    return <NoPermission isFullPage resourceText="create foreign data wrappers" />
  }

  return <CreateWrapper />
}

DatabaseWrappersNew.getLayout = (page) => <DatabaseLayout title="Wrappers">{page}</DatabaseLayout>

export default observer(DatabaseWrappersNew)

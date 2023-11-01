import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { NextPageWithLayout } from 'types'
import { useCheckPermissions } from 'hooks'
import { DatabaseLayout } from 'components/layouts'
import NoPermission from 'components/ui/NoPermission'
import { EditWrapper } from 'components/interfaces/Database'

const DatabaseWrappersNew: NextPageWithLayout = () => {
  const canReadWrappers = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'wrappers')

  if (!canReadWrappers) {
    return <NoPermission isFullPage resourceText="view foreign data wrappers" />
  }

  return <EditWrapper />
}

DatabaseWrappersNew.getLayout = (page) => <DatabaseLayout title="Wrappers">{page}</DatabaseLayout>

export default observer(DatabaseWrappersNew)

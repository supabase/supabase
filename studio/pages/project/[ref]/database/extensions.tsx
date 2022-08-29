import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { NextPageWithLayout } from 'types'
import { checkPermissions } from 'hooks'
import { DatabaseLayout } from 'components/layouts'
import { Extensions } from 'components/interfaces/Database'
import NoPermission from 'components/ui/NoPermission'

const DatabaseExtensions: NextPageWithLayout = () => {
  const canReadExtensions = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'extensions')
  if (!canReadExtensions) {
    return <NoPermission isFullPage resourceText="view database extensions" />
  }

  return <Extensions />
}

DatabaseExtensions.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default observer(DatabaseExtensions)

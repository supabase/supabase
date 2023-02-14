import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { DatabaseLayout } from 'components/layouts'
import { NextPageWithLayout } from 'types'
import { checkPermissions } from 'hooks'
import NoPermission from 'components/ui/NoPermission'
import CreateRole from 'components/interfaces/Database/Roles/CreateRole'

const CreateNewRole: NextPageWithLayout = () => {
  const canReadRoles = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'roles')
  if (!canReadRoles) {
    return <NoPermission isFullPage resourceText="view database roles" />
  }

  return <CreateRole />
}

CreateNewRole.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default observer(CreateNewRole)

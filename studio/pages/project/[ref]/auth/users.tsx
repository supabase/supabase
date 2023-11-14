import { PermissionAction } from '@supabase/shared-types/out/constants'

import { Users } from 'components/interfaces/Auth'
import { AuthLayout } from 'components/layouts'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions } from 'hooks'
import { NextPageWithLayout } from 'types'

const UsersPage: NextPageWithLayout = () => {
  const canReadUsers = useCheckPermissions(PermissionAction.TENANT_SQL_SELECT, 'auth.users')

  return !canReadUsers ? (
    <NoPermission isFullPage resourceText="access your project's users" />
  ) : (
    <Users />
  )
}

UsersPage.getLayout = (page) => <AuthLayout title="Auth">{page}</AuthLayout>

export default UsersPage

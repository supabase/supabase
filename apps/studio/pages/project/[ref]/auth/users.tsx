import { Users } from 'components/interfaces/Auth/Users/UsersV1/Users'
import { UsersV2 } from 'components/interfaces/Auth/Users/UsersV2'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import { useFlag } from 'hooks/ui/useFlag'
import type { NextPageWithLayout } from 'types'

const UsersPage: NextPageWithLayout = () => {
  const userManagementV2 = useFlag('userManagementV2')
  return userManagementV2 ? <UsersV2 /> : <Users />
}

UsersPage.getLayout = (page) => <AuthLayout title="Auth">{page}</AuthLayout>

export default UsersPage

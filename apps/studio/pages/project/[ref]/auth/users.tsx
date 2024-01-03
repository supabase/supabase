import { Users } from 'components/interfaces/Auth'
import { AuthLayout } from 'components/layouts'
import { NextPageWithLayout } from 'types'

const UsersPage: NextPageWithLayout = () => {
  return <Users />
}

UsersPage.getLayout = (page) => <AuthLayout title="Auth">{page}</AuthLayout>

export default UsersPage

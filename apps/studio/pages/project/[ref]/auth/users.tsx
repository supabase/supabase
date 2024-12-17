import { UsersV2 } from 'components/interfaces/Auth/Users/UsersV2'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import type { NextPageWithLayout } from 'types'

const UsersPage: NextPageWithLayout = () => {
  return <UsersV2 />
}

UsersPage.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout>
      <AuthLayout title="Auth">{page}</AuthLayout>
    </DefaultLayout>
  </AppLayout>
)

export default UsersPage

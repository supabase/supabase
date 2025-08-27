import { UsersV2 } from 'components/interfaces/Auth/Users/UsersV2'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import type { NextPageWithLayout } from 'types'

const UsersPage: NextPageWithLayout = () => {
  return (
    <PageLayout
      title="Users"
      subtitle="24 hours have signed in the last 7 days"
      isCompact
      size="full"
    >
      <UsersV2 />
    </PageLayout>
  )
}

UsersPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>{page}</AuthLayout>
  </DefaultLayout>
)

export default UsersPage

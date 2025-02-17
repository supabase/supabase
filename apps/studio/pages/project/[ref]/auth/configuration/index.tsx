import { useParams } from 'common'
import { BasicAuthSettingsForm } from 'components/interfaces/Auth'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import type { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => {
  return <BasicAuthSettingsForm />
}

PageLayout.getLayout = (page) => {
  return (
    <AppLayout>
      <DefaultLayout>
        <AuthLayout>{page}</AuthLayout>
      </DefaultLayout>
    </AppLayout>
  )
}

export default PageLayout

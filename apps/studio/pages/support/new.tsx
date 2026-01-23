import { SupportFormPage } from 'components/interfaces/Support/SupportFormPage'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { withAuth } from 'hooks/misc/withAuth'
import type { NextPageWithLayout } from 'types'

const SupportPage: NextPageWithLayout = () => {
  return <SupportFormPage />
}

SupportPage.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout>{page}</DefaultLayout>
  </AppLayout>
)

export default withAuth(SupportPage, { useHighestAAL: false })

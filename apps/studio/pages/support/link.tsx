import type { ReactElement } from 'react'
import { LinkSupportTicketPage } from 'components/interfaces/Support/LinkSupportTicketPage'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { withAuth } from 'hooks/misc/withAuth'
import type { NextPageWithLayout } from 'types'

const LinkSupportTicketPageRoute: NextPageWithLayout = () => {
  return <LinkSupportTicketPage />
}

LinkSupportTicketPageRoute.getLayout = (page: ReactElement) => (
  <AppLayout>
    <DefaultLayout>{page}</DefaultLayout>
  </AppLayout>
)

export default withAuth(LinkSupportTicketPageRoute, { useHighestAAL: false })


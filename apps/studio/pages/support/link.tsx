import { useRouter } from 'next/router'
import type { ReactElement } from 'react'
import { useEffect } from 'react'
import { LinkSupportTicketPage } from 'components/interfaces/Support/LinkSupportTicketPage'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { withAuth } from 'hooks/misc/withAuth'
import type { NextPageWithLayout } from 'types'
import { IS_PLATFORM } from 'lib/constants'

const LinkSupportTicketPageRoute: NextPageWithLayout = () => {
  const router = useRouter()

  useEffect(() => {
    if (!IS_PLATFORM) {
      router.push('/404')
    }
  }, [router])

  if (!IS_PLATFORM) {
    return null
  }

  return <LinkSupportTicketPage />
}

LinkSupportTicketPageRoute.getLayout = (page: ReactElement) => (
  <AppLayout>
    <DefaultLayout>{page}</DefaultLayout>
  </AppLayout>
)

export default withAuth(LinkSupportTicketPageRoute, { useHighestAAL: false })

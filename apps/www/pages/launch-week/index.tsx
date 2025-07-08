import { NextSeo } from 'next-seo'
import { LW15_DATE, LW15_TITLE, LW15_URL, SITE_ORIGIN } from 'lib/constants'
import { useRouter } from 'next/router'

import { Lw15ConfDataProvider } from 'components/LaunchWeek/15/hooks/use-conf-data'
import DefaultLayout from 'components/Layouts/Default'
import LW15LandingPage from 'components/LaunchWeek/15/Ticketing/LW15LandingPage'

const Lw15Page = () => {
  const TITLE = `${LW15_TITLE} | ${LW15_DATE}`
  const DESCRIPTION = 'Join us for a week of announcing new features, every day at 8AM PT.'
  const OG_IMAGE = `${SITE_ORIGIN}/images/launchweek/15/lw15-og.png?lw=15`

  const { query } = useRouter()
  const ticketNumber = query.ticketNumber?.toString()
  const defaultUserData = {
    id: query.id?.toString(),
    ticket_number: ticketNumber ? parseInt(ticketNumber, 10) : undefined,
    name: query.name?.toString(),
    username: query.username?.toString(),
    platinum: !!query.platinum,
  }

  return (
    <>
      <NextSeo
        title={TITLE}
        description={DESCRIPTION}
        openGraph={{
          title: TITLE,
          description: DESCRIPTION,
          url: LW15_URL,
          images: [
            {
              url: OG_IMAGE,
            },
          ],
        }}
      />

      <Lw15ConfDataProvider initState={{ userTicketData: defaultUserData }}>
        <DefaultLayout className="!min-h-[calc(100dvh-66px)] h-[calc(100dvh-66px)] dark:bg-black">
          <div
            style={{
              fontFamily:
                "SuisseIntl-Book, custom-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
            }}
            className="h-full"
          >
            <LW15LandingPage />
          </div>
        </DefaultLayout>
      </Lw15ConfDataProvider>
    </>
  )
}

export default Lw15Page

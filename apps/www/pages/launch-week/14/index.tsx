import { NextSeo } from 'next-seo'
import { LW14_DATE, LW14_TITLE, LW14_URL, SITE_ORIGIN } from 'lib/constants'
import { useRouter } from 'next/router'
import { Lw14ConfDataProvider } from 'components/LaunchWeek/14/hooks/use-conf-data'
import DefaultLayout from 'components/Layouts/Default'
import LWStickyNav from 'components/LaunchWeek/14/Releases/LWStickyNav'
import LWHeader from 'components/LaunchWeek/14/Releases/LWHeader'
import MainStage from 'components/LaunchWeek/14/Releases/MainStage'
import BuildStage from 'components/LaunchWeek/14/Releases/BuildStage'

const Lw14Page = () => {
  const TITLE = `${LW14_TITLE} | ${LW14_DATE}`
  const DESCRIPTION = 'Join us for a week of announcing new features, every day at 7 AM PT.'
  const OG_IMAGE = `${SITE_ORIGIN}/images/launchweek/14/lw14-og.png?lw=14`

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
          url: LW14_URL,
          images: [
            {
              url: OG_IMAGE,
            },
          ],
        }}
      />

      <Lw14ConfDataProvider initState={{ userTicketData: defaultUserData, partymodeStatus: 'on' }}>
        <DefaultLayout>
          <div
            style={{
              fontFamily: 'Departure Mono, Source Code Pro, Office Code Pro, Menlo, monospace',
            }}
          >
            <LWStickyNav />
            <LWHeader />
            <MainStage className="relative z-10" />
            <BuildStage />
          </div>
        </DefaultLayout>
      </Lw14ConfDataProvider>
    </>
  )
}

export default Lw14Page

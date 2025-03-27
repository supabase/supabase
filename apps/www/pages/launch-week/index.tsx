import { NextSeo } from 'next-seo'
import { LW14_DATE, LW14_TITLE, LW14_URL, SITE_ORIGIN } from '~/lib/constants'
import { LwView } from '~/components/LaunchWeek/14/LwView'
import { useRouter } from 'next/router'
import { Lw14ConfDataProvider } from '~/components/LaunchWeek/14/hooks/use-conf-data'
import DefaultLayout from '~/components/Layouts/Default'
import { Tunnel } from '~/components/LaunchWeek/14/Tunnel'

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
        <DefaultLayout className='font-["Departure_Mono"] lg:pt-32 border-b pb-0 md:pb-16 lg:!pb-[230px]'>
          <LwView />
          <div className="w-full h-[16vh] md:h-[24vh] lg:h-[32vh] absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-6 md:px-12 lg:px-16 xl:px-20">
            <Tunnel className="w-full h-full rotate-180" />
          </div>
        </DefaultLayout>
      </Lw14ConfDataProvider>
    </>
  )
}

export default Lw14Page

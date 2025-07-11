import dynamic from 'next/dynamic'
import { NextSeo } from 'next-seo'
import { LW15_DATE, LW15_TITLE, LW15_URL, SITE_ORIGIN } from 'lib/constants'
import { useRouter } from 'next/router'

import DefaultLayout from 'components/Layouts/Default'
import LW15Heading from 'components/LaunchWeek/15/LW15Heading'
import LW15MainStage from 'components/LaunchWeek/15/LW15MainStage'

import type { GetServerSideProps } from 'next'
import type { LumaEvent } from 'app/api-v2/luma-events/route'

const LW15BuildStage = dynamic(() => import('components/LaunchWeek/15/LW15BuildStage'))
const LW15Hackathon = dynamic(() => import('components/LaunchWeek/15/LW15Hackathon'))
const LW15Meetups = dynamic(() => import('components/LaunchWeek/15/LW15Meetups'))

interface Props {
  meetups: LumaEvent[]
}

const Lw15Page = ({ meetups }: Props) => {
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

      <div
        style={{
          fontFamily:
            "SuisseIntl-Book, custom-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
        }}
      >
        <DefaultLayout className="dark:bg-black">
          <LW15Heading />
          <LW15MainStage />
          <LW15BuildStage />
          <LW15Hackathon />
          <LW15Meetups meetups={meetups} />
        </DefaultLayout>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    // Date range for Launch Week 15: July 14th, 2025 to September 1st, 2025
    const afterDate = '2025-07-14T00:00:00.000Z'
    const beforeDate = '2025-09-01T23:59:59.999Z'

    const url = new URL(`${SITE_ORIGIN}/api-v2/luma-events`)
    url.searchParams.append('after', afterDate)
    url.searchParams.append('before', beforeDate)

    const res = await fetch(url.toString())
    const data = await res.json()

    if (data.success) {
      return {
        props: {
          meetups: data.events.filter((event: LumaEvent) =>
            event.name?.toLowerCase().includes('lw15')
          ),
        },
      }
    } else {
      console.error('Failed to fetch meetups:', data.error)
      return { props: { meetups: [] } }
    }
  } catch (error) {
    console.error('Error fetching meetups:', error)
    return { props: { meetups: [] } }
  }
}

export default Lw15Page

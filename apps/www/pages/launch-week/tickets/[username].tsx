import { NextSeo } from 'next-seo'
import dayjs from 'dayjs'
import Error from 'next/error'
import { GetStaticPaths, GetStaticProps } from 'next'
import { LW15_DATE, LW15_TITLE, LW15_URL, SITE_ORIGIN } from 'lib/constants'
import { Lw15ConfDataProvider, UserTicketData } from 'components/LaunchWeek/15/hooks/use-conf-data'
import { createClient } from '@supabase/supabase-js'
import DefaultLayout from 'components/Layouts/Default'
import LW15TicketPage from 'components/LaunchWeek/15/Ticketing/LW15TicketPage'
import { useRouter } from 'next/router'

interface Props {
  user: UserTicketData
  ogImageUrl: string
}

const Lw15Page = ({ user, ogImageUrl }: Props) => {
  const username = user?.username
  const TITLE = `${LW15_TITLE} | ${LW15_DATE}`
  const DESCRIPTION = 'Join us for a week of announcing new features, every day at 8AM PT.'
  const PAGE_URL = `${LW15_URL}/tickets/${username}`
  const { query } = useRouter()
  const ticketNumber = query.ticketNumber?.toString()
  const defaultUserData = {
    id: query.id?.toString(),
    ticket_number: ticketNumber ? parseInt(ticketNumber, 10) : undefined,
    name: query.name?.toString(),
    username: query.username?.toString(),
    platinum: !!query.platinum,
  }

  if (!username) {
    return <Error statusCode={404} />
  }

  return (
    <>
      <NextSeo
        title={TITLE}
        description={DESCRIPTION}
        openGraph={{
          title: TITLE,
          description: DESCRIPTION,
          url: PAGE_URL,
          images: [
            {
              url: ogImageUrl,
              width: 1200,
              height: 628,
            },
          ],
        }}
      />

      <Lw15ConfDataProvider initState={{ userTicketData: defaultUserData }}>
        <DefaultLayout className="!min-h-fit !h-fit lg:!min-h-[calc(100dvh-66px)] lg:!h-full dark:bg-black">
          <div
            style={{
              fontFamily:
                "SuisseIntl-Book, custom-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
            }}
            className="h-full"
          >
            <LW15TicketPage user={user} isSharePage />
          </div>
        </DefaultLayout>
      </Lw15ConfDataProvider>
    </>
  )
}

export default Lw15Page

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const username = params?.username?.toString() || null
  let user

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.LIVE_SUPABASE_COM_SERVICE_ROLE_KEY!
  )

  // fetch the normal ticket
  // stores the og images in supabase storage
  fetch(
    // @ts-ignore
    `${SITE_ORIGIN}/api-v2/ticket-og?username=${encodeURIComponent(username ?? '')}`
  )

  // fetch a specific user
  if (username) {
    const { data, error } = await supabaseAdmin!
      .from('tickets_view')
      .select('name, username, ticket_number, metadata, role, company, location')
      .eq('launch_week', 'lw15')
      .eq('username', username)
      .single()

    user = data
  }

  const ticketType = 'regular'
  const ogImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/launch-week/lw15/og/${ticketType}/${username}.png?t=${dayjs(new Date()).format('DHHmmss')}`

  return {
    props: {
      user,
      ogImageUrl,
      key: username,
    },
    revalidate: 5,
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  return Promise.resolve({
    paths: [],
    fallback: 'blocking',
  })
}

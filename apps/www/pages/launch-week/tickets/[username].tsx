import { NextSeo } from 'next-seo'
import dayjs from 'dayjs'
import Error from 'next/error'
import { GetStaticPaths, GetStaticProps } from 'next'
import { LW14_DATE, LW14_TITLE, LW14_URL, SITE_ORIGIN } from '~/lib/constants'
import { LwView } from '~/components/LaunchWeek/14/LwView'
import {
  Lw14ConfDataProvider,
  UserTicketData,
} from '~/components/LaunchWeek/14/hooks/use-conf-data'
import { createClient } from '@supabase/supabase-js'
import DefaultLayout from '~/components/Layouts/Default'
import { Tunnel } from '~/components/LaunchWeek/14/Tunnel'

interface Props {
  user: UserTicketData
  ogImageUrl: string
}

const Lw14Page = ({ user, ogImageUrl }: Props) => {
  const username = user?.username
  const TITLE = `${LW14_TITLE} | ${LW14_DATE}`
  const DESCRIPTION = 'Join us for a week of announcing new features, every day at 7 AM PT.'
  const PAGE_URL = `${LW14_URL}/tickets/${username}`

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

      <Lw14ConfDataProvider initState={{ partymodeStatus: 'on' }}>
        <DefaultLayout className='font-["Departure_Mono"] lg:pt-32 border-b pb-0 md:pb-16 lg:!pb-[230px]'>
          <LwView />
        </DefaultLayout>
      </Lw14ConfDataProvider>
    </>
  )
}

export default Lw14Page

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
      .select('name, username, ticket_number, metadata, platinum, secret, role, company, location')
      .eq('launch_week', 'lw14')
      .eq('username', username)
      .single()

    user = data
  }

  // fetch the platinum ticket
  // stores the og images in supabase storage
  if (user?.secret) {
    fetch(
      `${SITE_ORIGIN}/api-v2/ticket-og?username=${encodeURIComponent(username ?? '')}&secret=true`
    )
  } else if (user?.platinum) {
    // fetch /api-v2/ticket-og
    fetch(
      `${SITE_ORIGIN}/api-v2/ticket-og?username=${encodeURIComponent(username ?? '')}&platinum=true`
    )
  }

  const ticketType = user?.secret
    ? user?.platinum
      ? 'platinumSecret'
      : 'secret'
    : user?.platinum
      ? 'platinum'
      : 'regular'
  const ogImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/launch-week/lw14/og/${ticketType}/${username}.png?t=${dayjs(new Date()).format('DHHmmss')}`

  return {
    props: {
      user: {
        ...user,
        username,
      },
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

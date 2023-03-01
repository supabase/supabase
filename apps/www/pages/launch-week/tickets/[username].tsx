import { NextSeo } from 'next-seo'
import { GetStaticProps, GetStaticPaths } from 'next'
import Error from 'next/error'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import TicketContainer from '~/components/LaunchWeek/Ticket/TicketContainer'
import { SITE_URL, SAMPLE_TICKET_NUMBER } from '~/lib/constants'
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { FastGlobOptionsWithoutCwd } from 'globby'
import { useTheme } from 'common/Providers'
import LaunchWeekPrizeSection from '~/components/LaunchWeek/LaunchSection/LaunchWeekPrizeSection'
import { LaunchWeekLogoHeader } from '~/components/LaunchWeek/LaunchSection/LaunchWeekLogoHeader'
import TicketBrickWall from '~/components/LaunchWeek/LaunchSection/TicketBrickWall'

interface Props {
  user: user
  users: user[]
}

interface user {
  username: string | null
  name: string | null
  ticketNumber: number | null
  golden: boolean
  referrals: number
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_SECRET ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9idWxkYW5ycHRsb2t0eGNmZnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njk3MjcwMTIsImV4cCI6MTk4NTMwMzAxMn0.SZLqryz_-stF8dgzeVXmzZWPOqdOrBwqJROlFES8v3I'
)

export default function TicketShare({ user, users }: Props) {
  const { username, ticketNumber, name, golden, referrals } = user
  const { isDarkMode } = useTheme()

  const [supabase] = useState(() =>
    createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  )
  const description = 'Supabase Launch Week 6 | 12-16 Dec 2022'

  if (!ticketNumber) {
    return <Error statusCode={404} />
  }

  const ogImageUrl = `https://obuldanrptloktxcffvn.functions.supabase.co/lw7-ticket-og?username=${encodeURIComponent(
    username ?? ''
  )}`

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark bg-[#121212]' : 'light bg-[#fff]'
  }, [isDarkMode])

  return (
    <>
      <NextSeo
        title={`${name ? name + '’s' : 'Get your'} #SupaLaunchWeek Ticket`}
        openGraph={{
          title: `${name ? name + '’s' : 'Get your'} #SupaLaunchWeek Ticket`,
          description: description,
          url: `${SITE_URL}/tickets/${username}`,
          images: [
            {
              url: ogImageUrl,
            },
          ],
        }}
      />
      <DefaultLayout>
        <div className="bg-lw7 -mt-16 pt-12">
          <SectionContainer className="flex flex-col !pb-1 items-center lg:pt-32 gap-24">
            <LaunchWeekLogoHeader />
            <TicketContainer
              supabase={supabase}
              session={null}
              defaultUserData={{
                username: username || undefined,
                name: name || '',
                ticketNumber,
                golden,
                referrals,
              }}
              sharePage
            />
          </SectionContainer>
          <LaunchWeekPrizeSection />
          <TicketBrickWall users={users} />
        </div>
      </DefaultLayout>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const username = params?.username?.toString() || null
  let name: string | null | undefined
  let ticketNumber: number | null | undefined
  let golden = false
  let referrals = 0

  // fetch users for the TicketBrickWall
  const { data: users } = await supabaseAdmin!.from('lw7_tickets').select().limit(8)

  // fetch a specific user
  if (username) {
    const { data: user } = await supabaseAdmin!
      .from('lw7_tickets_golden')
      .select('name, ticketNumber, golden, referrals')
      .eq('username', username)
      .single()
    name = user?.name
    ticketNumber = user?.ticketNumber
    golden = user?.golden ?? false
    referrals = user?.referrals ?? 0
  }
  return {
    props: {
      user: {
        username: ticketNumber ? username : null,
        usernameFromParams: username || null,
        name: ticketNumber ? name || username || null : null,
        ticketNumber: ticketNumber || SAMPLE_TICKET_NUMBER,
        golden,
        referrals,
      },
      users,
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

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
import { useTheme } from '~/components/Providers'

type Props = {
  username: string | null
  name: string | null
  ticketNumber: number | null
  golden: boolean
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_SECRET ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9idWxkYW5ycHRsb2t0eGNmZnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njk3MjcwMTIsImV4cCI6MTk4NTMwMzAxMn0.SZLqryz_-stF8dgzeVXmzZWPOqdOrBwqJROlFES8v3I'
)

export default function TicketShare({ username, ticketNumber, name, golden }: Props) {
  const { isDarkMode } = useTheme()

  const [supabase] = useState(() =>
    createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  )
  const description = 'Supabase Launch Week 6 | 12-16 Dec 2022'

  if (!ticketNumber) {
    return <Error statusCode={404} />
  }

  const ogImageUrl = `https://obuldanrptloktxcffvn.functions.supabase.co/launchweek-ticket-og?username=${encodeURIComponent(
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
        <SectionContainer className="flex flex-col gap-8 pb-0 md:gap-16 lg:gap-16 items-center xl:items-start">
          <img
            src="/images/launchweek/launchweek-logo--light.svg"
            className="md:40 w-40 dark:hidden lg:w-80"
          />
          <img
            src="/images/launchweek/launchweek-logo--dark.svg"
            className="md:40 hidden w-40 dark:block lg:w-80"
          />
          <TicketContainer
            supabase={supabase}
            session={null}
            defaultUserData={{
              username: username || undefined,
              name: name || '',
              ticketNumber,
              golden,
            }}
            sharePage
          />
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const username = params?.username?.toString() || null
  let name: string | null | undefined
  let ticketNumber: number | null | undefined
  let golden = false

  if (username) {
    const { data: user } = await supabaseAdmin!
      .from('lw6_tickets_golden')
      .select('name, ticketNumber, golden')
      .eq('username', username)
      .single()
    name = user?.name
    ticketNumber = user?.ticketNumber
    golden = user?.golden ?? false
  }
  return {
    props: {
      username: ticketNumber ? username : null,
      usernameFromParams: username || null,
      name: ticketNumber ? name || username || null : null,
      ticketNumber: ticketNumber || SAMPLE_TICKET_NUMBER,
      golden,
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

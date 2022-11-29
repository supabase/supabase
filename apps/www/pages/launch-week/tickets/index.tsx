import { NextSeo } from 'next-seo'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import TicketContainer from '~/components/LaunchWeek/Ticket/TicketContainer'
import { SITE_URL } from '~/lib/constants'
import { useRouter } from 'next/router'
import { createClient, Session } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

export default function TicketHome() {
  const [supabase] = useState(() =>
    createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  )
  const [session, setSession] = useState<Session | null>(null)
  const description = 'Supabase Launch Week 6 | 12-16 Dec 2022'
  const { query } = useRouter()
  const ticketNumber = query.ticketNumber?.toString()
  const defaultUserData = {
    id: query.id?.toString(),
    ticketNumber: ticketNumber ? parseInt(ticketNumber, 10) : undefined,
    name: query.name?.toString(),
    username: query.username?.toString(),
  }

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
    })
  }, [])

  return (
    <>
      <NextSeo
        title={`Get your #SupaLaunchWeek Ticket`}
        openGraph={{
          title: `Get your #SupaLaunchWeek Ticket`,
          description: description,
          url: `${SITE_URL}/tickets`,
          images: [
            {
              url: `https://supabase.com/images/launchweek/og-image.jpg`, // TODO
            },
          ],
        }}
      />
      <div className="launch-week-gradientBg"></div>
      <DefaultLayout>
        <SectionContainer className="flex flex-col gap-8 !pb-0 md:gap-16 lg:gap-16">
          <img
            src="/images/launchweek/launchweek-logo--light.svg"
            className="md:40 w-28 dark:hidden lg:w-48"
          />
          <img
            src="/images/launchweek/launchweek-logo--dark.svg"
            className="md:40 hidden w-28 dark:block lg:w-48"
          />
          <TicketContainer
            supabase={supabase}
            session={session}
            defaultUserData={defaultUserData}
            defaultPageState={query.ticketNumber ? 'ticket' : 'registration'}
          />
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}

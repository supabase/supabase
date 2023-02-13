import { NextSeo } from 'next-seo'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import TicketContainer from '~/components/LaunchWeek/Ticket/TicketContainer'
import { SITE_URL } from '~/lib/constants'
import { useRouter } from 'next/router'
import { createClient, Session } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import { useTheme } from '~/components/Providers'

export default function TicketHome() {
  const { isDarkMode } = useTheme()

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

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark bg-[#121212]' : 'light bg-[#fff]'
  }, [isDarkMode])

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
      <DefaultLayout>
        <SectionContainer className="flex flex-col gap-16">
          <div className="flex flex-col gap-3 items-center justify-center xl:justify-start">
            <img
              src="/images/launchweek/launchweek-logo--light.svg"
              className="flex w-40 dark:hidden lg:w-80"
            />
            <img
              src="/images/launchweek/launchweek-logo--dark.svg"
              className="hidden w-40 dark:flex lg:w-80"
            />
            <p className="text-scale-1100 text-sm">Dec 12 – 16 at 8 AM PT | 11 AM ET</p>
          </div>

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

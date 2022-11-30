import { NextSeo } from 'next-seo'
import _days from '~/components/LaunchWeek/days.json'
import { WeekDayProps } from '~/components/LaunchWeek/types'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'

import { createClient, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import TicketContainer from '~/components/LaunchWeek/Ticket/TicketContainer'
import { useTheme } from '~/components/Providers'

const days = _days as WeekDayProps[]

export default function launchweek() {
  const { isDarkMode } = useTheme()

  const title = 'Launch Week 6'
  const description = 'Supabase Launch Week 6 | 12-18 Dec 2022'

  const [supabase] = useState(() =>
    createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  )
  const [session, setSession] = useState<Session | null>(null)
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
        title={title}
        openGraph={{
          title: title,
          description: description,
          url: `https://supabase.com/launch-week`,
          images: [
            {
              url: `https://supabase.com/images/launchweek/launch-week-6.jpg`,
            },
          ],
        }}
      />
      <DefaultLayout>
        <SectionContainer className="flex flex-col !pb-24 items-center lg:pt-32 gap-32">
          <div className="flex flex-col justify-center gap-3">
            <div className="flex justify-center">
              <img
                src="/images/launchweek/launchweek-logo--light.svg"
                className="flex w-40 dark:hidden lg:w-80"
              />
              <img
                src="/images/launchweek/launchweek-logo--dark.svg"
                className="hidden w-40 dark:flex lg:w-80"
              />
            </div>
            <p className="text-scale-1100 text-sm text-center">Dec 12 – 16 at 8 AM PT | 11 AM ET</p>
          </div>
          <TicketContainer
            supabase={supabase}
            session={session}
            defaultUserData={defaultUserData}
            defaultPageState={query.ticketNumber ? 'ticket' : 'registration'}
          />
        </SectionContainer>
        <div className="gradient-container">
          <div className="gradient-mask"></div>
          <div className="gradient-mask--masked bottom-of-the-circle"></div>

          <div className="flair-mask-a the-stroke-of-the-circle"></div>
          <div className="flair-mask-b inside-the-circle"></div>
        </div>
      </DefaultLayout>
    </>
  )
}

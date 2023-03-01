import { NextSeo } from 'next-seo'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import TicketContainer from '~/components/LaunchWeek/Ticket/TicketContainer'
import { SITE_URL } from '~/lib/constants'
import { useRouter } from 'next/router'
import { createClient, Session, SupabaseClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import { IconArrowDown, useTheme } from 'ui'
import LabelBadge from '~/components/LaunchWeek/LabelBadge'
import launchweek from './6'
import LaunchWeekPrizeSection from '~/components/LaunchWeek/LaunchSection/LaunchWeekPrizeSection'
import { LaunchWeekLogoHeader } from '~/components/LaunchWeek/LaunchSection/LaunchWeekLogoHeader'
import TicketBrickWall from '~/components/LaunchWeek/LaunchSection/TicketBrickWall'

export default function TicketHome() {
  const { isDarkMode } = useTheme()

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const description = 'Supabase Launch Week 7 | 3-7 April 2023'
  const { query, pathname } = useRouter()
  const isLauchWeekPage = pathname.includes('launch-week')
  const ticketNumber = query.ticketNumber?.toString()

  const defaultUserData = {
    id: query.id?.toString(),
    ticketNumber: ticketNumber ? parseInt(ticketNumber, 10) : undefined,
    name: query.name?.toString(),
    username: query.username?.toString(),
  }

  useEffect(() => {
    if (!supabase) {
      setSupabase(
        createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
      )
    }
  }, [])

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        setSession(session)
      })

      return () => subscription.unsubscribe()
    }
  }, [supabase])

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
        <div className="bg-lw7 -mt-16 pt-12">
          <SectionContainer className="flex flex-col !pb-1 items-center lg:pt-32 gap-24">
            <LaunchWeekLogoHeader />

            {supabase && (
              <TicketContainer
                supabase={supabase}
                session={session}
                defaultUserData={defaultUserData}
                defaultPageState="ticket"
              />
            )}

            <div>
              <a href="#lw-7-prizes" className="flex items-center text-white text-sm gap-4">
                More about the prizes <IconArrowDown w={10} h={12} />
              </a>
            </div>
          </SectionContainer>

          <LaunchWeekPrizeSection />
          <TicketBrickWall />
        </div>
      </DefaultLayout>
    </>
  )
}

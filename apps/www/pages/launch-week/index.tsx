import { NextSeo } from 'next-seo'
import { GetStaticProps, GetStaticPaths } from 'next'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import TicketContainer from '~/components/LaunchWeek/Ticket/TicketContainer'
import { SITE_URL } from '~/lib/constants'
import { useRouter } from 'next/router'
import { createClient, Session, SupabaseClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { IconArrowDown, useTheme } from 'ui'
import LaunchWeekPrizeSection from '~/components/LaunchWeek/LaunchSection/LaunchWeekPrizeSection'
import { LaunchWeekLogoHeader } from '~/components/LaunchWeek/LaunchSection/LaunchWeekLogoHeader'

import { UserData } from '~/components/LaunchWeek/Ticket/hooks/use-conf-data'
import TicketBrickWall from '~/components/LaunchWeek/LaunchSection/TicketBrickWall'
import Image from 'next/image'
import LW7BgGraphic from '../../components/LaunchWeek/LW7BgGraphic'

interface Props {
  users: UserData[]
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_SECRET ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9idWxkYW5ycHRsb2t0eGNmZnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njk3MjcwMTIsImV4cCI6MTk4NTMwMzAxMn0.SZLqryz_-stF8dgzeVXmzZWPOqdOrBwqJROlFES8v3I'
)

export default function TicketHome({ users }: Props) {
  const { isDarkMode } = useTheme()

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const description = 'Supabase Launch Week 7 | 3-7 April 2023'
  const { query, pathname } = useRouter()
  const isLauchWeekPage = pathname.includes('launch-week')
  const ticketNumber = query.ticketNumber?.toString()
  const { scrollYProgress } = useScroll()

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

  const graphicsScale = useTransform(
    scrollYProgress,
    // Map scrollYProgress from these values:
    [0, 0.5],
    // Into these scale values:
    [1, 1.8]
  )
  const graphicsY = useTransform(
    scrollYProgress,
    // Map scrollYProgress from these values:
    [0, 0.5],
    // Into these values:
    [0, 120]
  )

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
        <div className="bg-[#1C1C1C] -mt-20">
          <div className="relative bg-lw7 pt-20">
            <div className="relative z-10">
              <SectionContainer className="flex flex-col justify-between items-center py-10 !pb-16 gap-8 lg:gap-16 !mx-auto !px-2">
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
                    More about the prizes{' '}
                    <span className="bounce-loop">
                      <IconArrowDown w={10} h={12} />
                    </span>
                  </a>
                </div>
              </SectionContainer>
              <LW7BgGraphic />
            </div>
            {/* TODO: set gold gradient if ticket is gold */}
            <div className="bg-lw7-gradient absolute inset-0 z-0" />
          </div>

          <LaunchWeekPrizeSection className="-mt-60" />

          {users && <TicketBrickWall users={users} />}
        </div>
      </DefaultLayout>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  // fetch users for the TicketBrickWall
  const { data: users } = await supabaseAdmin!.from('lw7_tickets').select().limit(8)

  return {
    props: {
      users,
    },
    revalidate: 5,
  }
}

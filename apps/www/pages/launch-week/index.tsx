import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { createClient, Session, SupabaseClient } from '@supabase/supabase-js'

import { SITE_ORIGIN, SITE_URL } from '~/lib/constants'

import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { LaunchWeekLogoHeader } from '~/components/LaunchWeek/LaunchSection/LaunchWeekLogoHeader'
import { UserData } from '~/components/LaunchWeek/Ticket/hooks/use-conf-data'
import LW7BgGraphic from '~/components/LaunchWeek/LW7BgGraphic'
import { useTheme } from 'common/Providers'

const TicketContainer = dynamic(() => import('~/components/LaunchWeek/Ticket/TicketContainer'))
const LW7Releases = dynamic(() => import('~/components/LaunchWeek/Releases/LW7/LW7Releases'))
const LaunchWeekPrizeSection = dynamic(
  () => import('~/components/LaunchWeek/LaunchSection/LaunchWeekPrizeSection')
)
const TicketBrickWall = dynamic(
  () => import('~/components/LaunchWeek/LaunchSection/TicketBrickWall')
)
const CTABanner = dynamic(() => import('~/components/CTABanner'))

interface Props {
  users: UserData[]
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_IECHOR_URL ?? 'http://localhost:54321',
  process.env.IECHOR_SERVICE_ROLE_SECRET ??
    process.env.NEXT_PUBLIC_IECHOR_SERVICE_ROLE_SECRET ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9idWxkYW5ycHRsb2t0eGNmZnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njk3MjcwMTIsImV4cCI6MTk4NTMwMzAxMn0.SZLqryz_-stF8dgzeVXmzZWPOqdOrBwqJROlFES8v3I'
)

export default function TicketHome({ users }: Props) {
  const { query } = useRouter()
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const { isDarkMode } = useTheme()

  const TITLE = 'Supabase LaunchWeek 7'
  const DESCRIPTION = 'Supabase Launch Week 7 | 10–14 April 2023'
  const OG_IMAGE = `${SITE_ORIGIN}/images/launchweek/seven/launch-week-7-teaser.jpg`
  const ticketNumber = query.ticketNumber?.toString()
  const bgImageId = query.bgImageId?.toString()

  const defaultUserData = {
    id: query.id?.toString(),
    ticketNumber: ticketNumber ? parseInt(ticketNumber, 10) : undefined,
    name: query.name?.toString(),
    username: query.username?.toString(),
    golden: !!query.golden,
    bgImageId: bgImageId ? parseInt(bgImageId, 10) : undefined,
  }

  useEffect(() => {
    if (!supabase) {
      setSupabase(
        createClient(
          process.env.NEXT_PUBLIC_IECHOR_URL!,
          process.env.NEXT_PUBLIC_IECHOR_ANON_KEY!
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
    document.body.className = '!dark bg-[#1C1C1C]'
    return () => {
      document.body.className = isDarkMode ? 'dark' : 'light'
    }
  }, [])

  const Ticket = () =>
    supabase && (
      <div className="w-full max-w-[100vw] px-4 flex justify-center py-8 md:py-20">
        <TicketContainer
          supabase={supabase}
          session={session}
          defaultUserData={defaultUserData}
          defaultPageState="ticket"
        />
      </div>
    )

  return (
    <>
      <NextSeo
        title={TITLE}
        description={DESCRIPTION}
        openGraph={{
          title: TITLE,
          description: DESCRIPTION,
          url: SITE_URL,
          images: [
            {
              url: OG_IMAGE,
            },
          ],
        }}
      />
      <DefaultLayout>
        <div className="bg-[#1C1C1C] -mt-[65px]">
          <div className="relative bg-lw7 pt-16">
            <div className="relative z-10">
              <SectionContainer className="flex flex-col justify-around items-center !py-4 md:!py-8 gap-2 md:gap-4 !px-2 !mx-auto">
                <LaunchWeekLogoHeader />
              </SectionContainer>
              <LW7BgGraphic />
            </div>
          </div>

          <div className="relative !w-full max-w-[100vw] !px-4 sm:max-w-xl md:max-w-4xl lg:max-w-7xl -mt-48 md:mt-[-460px] z-20 flex flex-col justify-around items-center !py-4 md:!py-8 gap-2 md:gap-4 !mx-auto">
            <LW7Releases />
            <LaunchWeekPrizeSection className="pt-10" ticket={Ticket} />
          </div>
          {users && <TicketBrickWall users={users} />}
        </div>
        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  // fetch users for the TicketBrickWall
  const { data: users } = await supabaseAdmin!
    .from('lw7_tickets_golden')
    .select('*')
    .order('createdAt', { ascending: false })
    .limit(17)

  return {
    props: {
      users,
    },
  }
}

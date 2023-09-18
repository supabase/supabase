import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@supabase/supabase-js'

import { SITE_ORIGIN, SITE_URL } from '~/lib/constants'

import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { LaunchWeekLogoHeader } from '~/components/LaunchWeek/7/LaunchSection/LaunchWeekLogoHeader'
import { UserData } from '~/components/LaunchWeek/hooks/use-conf-data'
import LW7BgGraphic from '~/components/LaunchWeek/7/LW7BgGraphic'
import { useTheme } from 'common/Providers'

const LW7Releases = dynamic(() => import('~/components/LaunchWeek/7/Releases'))
const LaunchWeekPrizeSection = dynamic(
  () => import('~/components/LaunchWeek/7/LaunchWeekPrizeSection')
)
const TicketBrickWall = dynamic(
  () => import('~/components/LaunchWeek/7/LaunchSection/TicketBrickWall')
)
const CTABanner = dynamic(() => import('~/components/CTABanner'))

interface Props {
  users: UserData[]
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321',
  // ANON KEY
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
export default function TicketHome({ users }: Props) {
  const { isDarkMode, toggleTheme } = useTheme()

  const TITLE = 'Supabase LaunchWeek 7'
  const DESCRIPTION = 'Supabase Launch Week 7 | 10–14 April 2023'
  const OG_IMAGE = `${SITE_ORIGIN}/images/launchweek/seven/launch-week-7-teaser.jpg`

  useEffect(() => {
    toggleTheme(true)
    document.body.className = 'bg-[#1C1C1C]'
    return () => {
      document.body.className = ''
      isDarkMode ? toggleTheme(true) : toggleTheme(false)
    }
  }, [])

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
            <LaunchWeekPrizeSection className="pt-10" />
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

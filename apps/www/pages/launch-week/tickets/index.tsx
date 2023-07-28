import { NextSeo } from 'next-seo'
import { GetServerSideProps } from 'next'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { SITE_ORIGIN, SITE_URL } from '~/lib/constants'
import { createClient } from '@supabase/supabase-js'
import { useEffect, useRef, useState } from 'react'
import { LaunchWeekLogoHeader } from '~/components/LaunchWeek/LaunchSection/LaunchWeekLogoHeader'
import { motion } from 'framer-motion'
import { UserData } from '~/components/LaunchWeek/Ticket/hooks/use-conf-data'
import LW7BgGraphic from '../../../components/LaunchWeek/LW7BgGraphic'
import CTABanner from '../../../components/CTABanner'
import { debounce } from 'lodash'
import TicketsGrid from '../../../components/LaunchWeek/Ticket/TicketsGrid'
import { Button } from 'ui'
import Link from 'next/link'
import { useTheme } from 'common/Providers'

interface Props {
  users: UserData[]
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_IECHOR_URL ?? 'http://localhost:54321',
  process.env.IECHOR_SERVICE_ROLE_SECRET ??
    process.env.NEXT_PUBLIC_IECHOR_SERVICE_ROLE_SECRET ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9idWxkYW5ycHRsb2t0eGNmZnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njk3MjcwMTIsImV4cCI6MTk4NTMwMzAxMn0.SZLqryz_-stF8dgzeVXmzZWPOqdOrBwqJROlFES8v3I'
)

const generateOgs = async (users: UserData[]) => {
  users?.map(async (user) => {
    const ogImageUrl = `https://obuldanrptloktxcffvn.functions.supabase.co/lw7-ticket-og?username=${encodeURIComponent(
      user.username ?? ''
    )}${!!user.golden ? '&golden=true' : ''}`
    return await fetch(ogImageUrl)
  })
}

export default function TicketsPage({ users }: Props) {
  const ref = useRef(null)
  const PAGE_COUNT = 20
  const TITLE = '#SupaLaunchWeek Tickets'
  const DESCRIPTION = 'Supabase Launch Week 7 | 10–14 April 2023'
  const OG_IMAGE = `${SITE_ORIGIN}/images/launchweek/seven/launch-week-7-teaser.jpg`

  const { isDarkMode } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [offset, setOffset] = useState(1)
  const [isLast, setIsLast] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [loadedUsers, setLoadedUsers] = useState<any[]>(users)

  useEffect(() => {
    loadMoreUsers(offset)
  }, [hasLoaded])

  const loadUsers = async (offset: number) => {
    const from = offset * PAGE_COUNT
    return await supabaseAdmin!
      .from('lw7_tickets_golden')
      .select('*')
      .range(from, from + PAGE_COUNT - 1)
      .order('createdAt', { ascending: false })
  }

  const loadMoreUsers = async (offset: number) => {
    if (isLast) return
    setIsLoading(true)
    setOffset((prev) => prev + 1)
    const { data: users } = await loadUsers(offset)
    setLoadedUsers((prevUsers) => [...prevUsers, ...(users as any[])])
    if ((users as any[]).length < PAGE_COUNT) setIsLast(true)
    setIsLoading(false)
  }

  const handleScroll = () => {
    if (ref.current && typeof window !== 'undefined') {
      const rect = (ref.current as HTMLDivElement)?.getBoundingClientRect()
      const isInView = rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
      setHasLoaded((prev) => !prev && isInView)
    }
  }

  useEffect(() => {
    document.body.className = '!dark bg-[#1C1C1C]'

    const handleDebouncedScroll = debounce(() => !isLast && handleScroll(), 200)
    window.addEventListener('scroll', handleDebouncedScroll)

    return () => {
      document.body.className = isDarkMode ? 'dark' : 'light'
      window.removeEventListener('scroll', handleDebouncedScroll)
    }
  }, [])

  return (
    <>
      <NextSeo
        title={TITLE}
        openGraph={{
          title: TITLE,
          description: DESCRIPTION,
          url: `${SITE_URL}/tickets`,
          images: [
            {
              url: OG_IMAGE,
            },
          ],
        }}
      />
      <DefaultLayout>
        <div className="bg-[#1C1C1C] -mt-[65px]">
          <div className="relative bg-lw7 pt-20">
            <div className="relative z-10">
              <SectionContainer className="flex flex-col justify-around items-center !py-4 md:!py-8 gap-2 md:gap-4 !px-2 !mx-auto h-auto">
                <LaunchWeekLogoHeader />
              </SectionContainer>
              <LW7BgGraphic />
            </div>
            <div className="bg-lw7-gradient absolute inset-0 z-0" />
          </div>
          <SectionContainer className="z-10 -mt-60 md:-mt-[500px] max-w-none overflow-hidden">
            <div className="text-center relative z-10 text-white mb-4 lg:mb-10">
              <motion.div
                className="max-w-[38rem] mx-auto px-4 flex flex-col items-center gap-4"
                initial={{ y: -20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, margin: '-150px' }}
                transition={{ type: 'spring', bounce: 0, delay: 0.2 }}
              >
                <h2 className="text-4xl">
                  Check out <span className="gradient-text-pink-500">all the tickets</span>
                </h2>
                <p className="radial-gradient-text-scale-500">
                  Join us on April 16th for Launch Week 7's final day{' '}
                  <br className="hidden md:inline-block" /> and find out if you are one of the lucky
                  winners. Get sharing!
                </p>
                <div className="mt-1">
                  <Link href="/launch-week">
                    <a>
                      <Button type="outline" size="medium">
                        Go to Launch Week 7
                      </Button>
                    </a>
                  </Link>
                </div>
              </motion.div>
            </div>
            <div ref={ref}>
              <TicketsGrid
                loadedUsers={loadedUsers}
                isLoading={isLoading}
                pageCount={PAGE_COUNT}
                offset={offset}
              />
            </div>
          </SectionContainer>
        </div>
        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const { data: users } = await supabaseAdmin!
    .from('lw7_tickets_golden')
    .select('*')
    .order('createdAt', { ascending: false })
    .limit(20)

  // Generate og images of not present
  generateOgs(users as any[])

  return {
    props: {
      users,
    },
  }
}

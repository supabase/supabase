import { NextSeo } from 'next-seo'
import { GetServerSideProps } from 'next'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { SITE_ORIGIN, SITE_URL } from '~/lib/constants'
import { createClient } from '@supabase/supabase-js'
import { useEffect, useRef, useState } from 'react'
import { LaunchWeekLogoHeader } from '~/components/LaunchWeek/7/LaunchSection/LaunchWeekLogoHeader'
import { motion } from 'framer-motion'
import { UserData } from '~/components/LaunchWeek/hooks/use-conf-data'
import LW7BgGraphic from '~/components/LaunchWeek/7/LW7BgGraphic'
import CTABanner from '~/components/CTABanner'
import { debounce } from 'lodash'
import TicketsGrid from '~/components/LaunchWeek/7/TicketsGrid'
import { Button } from 'ui'
import Link from 'next/link'
import { useTheme } from 'next-themes'

interface Props {
  users: UserData[]
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_MISC_USE_URL ?? 'http://localhost:54321',
  process.env.NEXT_PUBLIC_MISC_USE_ANON_KEY!
)

const generateOgs = async (users: UserData[]) => {
  users?.map(async (user) => {
    const ogImageUrl = `https://obuldanrptloktxcffvn.supabase.co/functions/v1/lw7-ticket-og?username=${encodeURIComponent(
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

  const { resolvedTheme } = useTheme()
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
      document.body.className = resolvedTheme?.includes('dark') ? 'dark' : 'light'
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
                <p className="radial-gradient-text-500">Submissions are closed.</p>
                <div className="mt-1">
                  <Button asChild type="outline" size="medium">
                    <Link href="/launch-week/7">Go to Launch Week 7</Link>
                  </Button>
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

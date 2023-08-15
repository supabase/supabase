import { useEffect, useRef, useState } from 'react'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import { Button } from 'ui'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@supabase/supabase-js'
import { debounce } from 'lodash'

import { SITE_ORIGIN, SITE_URL } from '~/lib/constants'
import { useTheme } from 'common/Providers'

import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { UserData } from '~/components/LaunchWeek/hooks/use-conf-data'
import CTABanner from '~/components/CTABanner'
import TicketsGrid from '~/components/LaunchWeek/8/TicketsGrid'

interface Props {
  users: UserData[]
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_SECRET ??
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_SECRET ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9idWxkYW5ycHRsb2t0eGNmZnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njk3MjcwMTIsImV4cCI6MTk4NTMwMzAxMn0.SZLqryz_-stF8dgzeVXmzZWPOqdOrBwqJROlFES8v3I'
)

const generateOgs = async (users: UserData[]) => {
  users?.map(async (user) => {
    const ogImageUrl = `https://obuldanrptloktxcffvn.functions.supabase.co/lw8-ticket-og?username=${encodeURIComponent(
      user.username ?? ''
    )}${!!user.golden ? '&golden=true' : ''}`
    return await fetch(ogImageUrl)
  })
}

export default function TicketsPage({ users }: Props) {
  const ref = useRef(null)
  const PAGE_COUNT = 20
  const TITLE = '#SupaLaunchWeek Tickets'
  const DESCRIPTION = 'Supabase Launch Week 8 | 7–11 August 2023'
  const OG_IMAGE = `${SITE_ORIGIN}/images/launchweek/8/lw8-og.jpg`

  const { isDarkMode, toggleTheme } = useTheme()
  const [initialDarkMode] = useState(isDarkMode)
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
      .from('lw8_tickets_golden')
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
    const handleDebouncedScroll = debounce(() => !isLast && handleScroll(), 200)

    window.addEventListener('scroll', handleDebouncedScroll)

    return () => {
      window.removeEventListener('scroll', handleDebouncedScroll)
    }
  }, [])

  useEffect(() => {
    toggleTheme(true)
    document.body.className = 'dark bg-[#020405]'
    return () => {
      document.body.className = ''
      toggleTheme(initialDarkMode)
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
        <div className="">
          <SectionContainer className="z-10">
            <div className="text-center relative z-10 text-white mb-4 lg:mb-10">
              <motion.div
                className="max-w-[38rem] mx-auto px-4 flex flex-col items-center gap-4"
                initial={{ y: -20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, margin: '-150px' }}
                transition={{ type: 'spring', bounce: 0, delay: 0.2 }}
              >
                <h2 className="text-4xl">Launch Week 8 tickets</h2>
                <p className="text-[#9296AA]">
                  Join us on August 11th for Launch Week 8's final day{' '}
                  <br className="hidden md:inline-block" /> and find out if you are one of the lucky
                  winners.
                </p>
                <div className="mt-1">
                  <Link href="/launch-week">
                    <a>
                      <Button type="outline" size="medium">
                        Go to Launch Week 8
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
          <div className="absolute w-full aspect-[1/1] md:aspect-[1.5/1] lg:aspect-[2.5/1] inset-0 z-0 pointer-events-none">
            <Image
              src="/images/launchweek/8/LW8-gradient.png"
              layout="fill"
              objectFit="cover"
              objectPosition="top"
              priority
              draggable={false}
            />
          </div>
        </div>
        <CTABanner className="!bg-[#020405] border-t-0" />
      </DefaultLayout>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const { data: users } = await supabaseAdmin!
    .from('lw8_tickets_golden')
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

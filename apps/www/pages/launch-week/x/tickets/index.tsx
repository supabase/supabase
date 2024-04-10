import { useEffect, useRef, useState } from 'react'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import { Button } from 'ui'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { debounce } from 'lodash'

import { SITE_ORIGIN, SITE_URL } from '~/lib/constants'
import { useTheme } from 'next-themes'

import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { UserData } from '~/components/LaunchWeek/hooks/use-conf-data'
import CTABanner from '~/components/CTABanner'
import TicketsGrid from '~/components/LaunchWeek/X/TicketsGrid'
import supabase from '~/lib/supabaseMisc'

interface Props {
  users: UserData[]
}

const generateOgs = async (users: UserData[]) => {
  users?.map(async (user) => {
    const ogImageUrl = `https://obuldanrptloktxcffvn.supabase.co/functions/v1/lwx-ticket?username=${encodeURIComponent(
      user.username ?? ''
    )}${!!user.golden ? '&platinum=true' : ''}`
    return await fetch(ogImageUrl)
  })
}

export default function TicketsPage({ users }: Props) {
  const ref = useRef(null)
  const PAGE_COUNT = 20
  const TITLE = '#SupaLaunchWeek X Tickets'
  const DESCRIPTION = 'Supabase Launch Week X | 11-15 December 2023'
  const OG_IMAGE = `${SITE_ORIGIN}/images/launchweek/lwx/lwx-og.jpg`

  const { resolvedTheme, setTheme } = useTheme()
  const [initialDarkMode] = useState(resolvedTheme?.includes('dark'))
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
    return await supabase!
      .from('lwx_tickets_golden')
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
    setTheme('dark')
    document.body.className = 'dark bg-[#060809]'
    return () => {
      document.body.className = ''
      setTheme('dark')
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
        <div>
          <SectionContainer className="z-10">
            <div className="text-center relative z-10 text-white mb-4 lg:mb-10">
              <motion.div
                className="max-w-[38rem] mx-auto px-4 flex flex-col items-center gap-4"
                initial={{ y: -20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, margin: '-150px' }}
                transition={{ type: 'spring', bounce: 0, delay: 0.2 }}
              >
                <h2 className="text-4xl">Launch Week X tickets</h2>
                <p className="text-foreground-light">
                  Join us on Launch Week X's final day <br className="hidden md:inline-block" /> and
                  find out if you are one of the lucky winners.
                </p>
                <div className="mt-1">
                  <Button asChild type="outline" size="medium">
                    <Link href="/launch-week/x">Go to Launch Week X</Link>
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
        <CTABanner className="!bg-[#060809] border-t-0" />
      </DefaultLayout>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  let { data: lwx_tickets, error } = await supabase
    .from('lwx_tickets_golden')
    .select('*')

    .order('createdAt', { ascending: false })
    .limit(20)

  // Generate og images of not present
  generateOgs(lwx_tickets as any[])

  return {
    props: {
      users: lwx_tickets,
    },
  }
}

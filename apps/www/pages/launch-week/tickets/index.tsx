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
import Link from 'next/link'
import Image from 'next/image'

interface Props {
  users: UserData[]
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_SECRET ??
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_SECRET ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9idWxkYW5ycHRsb2t0eGNmZnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njk3MjcwMTIsImV4cCI6MTk4NTMwMzAxMn0.SZLqryz_-stF8dgzeVXmzZWPOqdOrBwqJROlFES8v3I'
)

export const getPagination = (page: number = 1, size: number) => {
  const limit = size ? +size : 3
  const from = page ? page * limit : 0
  const to = page ? from + size : size

  return { from, to }
}

const loadUsers = async (offset = 0, pageCount: number) => {
  const { from, to } = getPagination(offset, pageCount)

  console.log('from: ', from, ',to: ', to)

  return await supabaseAdmin!
    .from('lw7_tickets_golden')
    .select('*')
    .range(from, to)
    .order('createdAt', { ascending: false })
}

export default function TicketsPage({ users }: Props) {
  const ref = useRef(null)
  const PAGE_COUNT = 5
  const STORAGE_URL = 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lw7'
  const description = 'Supabase Launch Week 7 | 3-7 April 2023'
  const [isLoading, setIsLoading] = useState(false)
  const [offset, setOffset] = useState(1)
  const [loadedUsers, setLoadedUsers] = useState<any[]>(users)

  // useEffect(() => {
  //   loadMoreUsers(offset)
  // }, [])

  const loadMoreUsers = async (offset: number) => {
    setOffset((prev) => prev + 1)
    setIsLoading(true)
    const { data: users } = await loadUsers(offset, PAGE_COUNT)
    console.log(`loaded users (offset ${offset}): `, users)
    setLoadedUsers((prevUsers) => [...prevUsers, ...(users as any[])])
    setIsLoading(false)
  }

  const getOgUrl = (username: string, isGold: boolean) =>
    `${STORAGE_URL}/tickets/gallery/${username}.png`

  useEffect(() => {
    document.body.className = 'dark bg-[#1C1C1C]'
  }, [])

  // TODO: trigger load more when scrolling to bottom
  // const isInView = useInView(ref, { margin: '100% 0px 0px 0px' })

  return (
    <>
      <NextSeo
        title={`#SupaLaunchWeek Tickets`}
        openGraph={{
          title: `#SupaLaunchWeek Tickets`,
          description: description,
          url: `${SITE_URL}/tickets`,
          images: [
            {
              url: `${SITE_ORIGIN}/images/launchweek/seven/launch-week-7-teaser.jpg`,
            },
          ],
        }}
      />
      <DefaultLayout>
        <div className="bg-[#1C1C1C] -mt-20">
          <div className="relative bg-lw7 pt-20">
            <div className="relative z-10">
              <SectionContainer className="flex flex-col justify-around items-center !py-4 md:!py-8 gap-2 md:gap-4 !px-2 !mx-auto h-auto">
                <LaunchWeekLogoHeader />
              </SectionContainer>
              <LW7BgGraphic />
            </div>
            <div className="bg-lw7-gradient absolute inset-0 z-0" />
          </div>
          <SectionContainer className="z-10 -mt-20 md:-mt-60">
            <div ref={ref} className="grid grid-cols-3 gap-3 py-12 relative">
              {loadedUsers?.map((user, i) => (
                <Link
                  href={`/launch-week/tickets/${user.username}`}
                  key={`${user.username}-000${i}`}
                >
                  <motion.a
                    className="relative w-full rounded-lg overflow-hidden transform scale-100 md:hover:scale-[101%]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 0.4,
                        ease: [0.24, 0.25, 0.05, 1],
                        delay: i / 15,
                      },
                    }}
                  >
                    <div className="relative inset-0 w-full pt-[50%] transform">
                      <Image
                        src={getOgUrl(user.username!, !!user.golden)}
                        alt={user.username}
                        layout="fill"
                        objectFit="cover"
                        objectPosition="center"
                        placeholder="blur"
                        blurDataURL="/images/blur.png"
                      />
                    </div>
                  </motion.a>
                </Link>
              ))}
              {isLoading && <div>loading...</div>}
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
    .limit(6)

  return {
    props: {
      users,
    },
  }
}

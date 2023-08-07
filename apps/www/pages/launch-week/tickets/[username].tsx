import { useEffect, useState } from 'react'
import { NextSeo } from 'next-seo'
import { GetStaticProps, GetStaticPaths } from 'next'
import Image from 'next/image'
import Error from 'next/error'
import dynamic from 'next/dynamic'
import { Session, SupabaseClient, createClient } from '@supabase/supabase-js'
import { useTheme } from 'common/Providers'

import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import TicketContainer from '~/components/LaunchWeek/8/Ticket/TicketContainer'
import { SITE_URL } from '~/lib/constants'
import { PageState, ConfDataContext, UserData } from '~/components/LaunchWeek/hooks/use-conf-data'

const LaunchWeekPrizeSection = dynamic(
  () => import('~/components/LaunchWeek/8/LaunchWeekPrizeSection')
)
const TicketBrickWall = dynamic(() => import('~/components/LaunchWeek/8/TicketBrickWall'))
const CTABanner = dynamic(() => import('~/components/CTABanner'))

interface Props {
  user: UserData
  users: UserData[]
  ogImageUrl: string
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321',
  // ANON KEY
  process.env.SUPABASE_SERVICE_ROLE_SECRET ??
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_SECRET ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9idWxkYW5ycHRsb2t0eGNmZnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njk3MjcwMTIsImV4cCI6MTk4NTMwMzAxMn0.SZLqryz_-stF8dgzeVXmzZWPOqdOrBwqJROlFES8v3I'
)

export default function UsernamePage({ user, users, ogImageUrl }: Props) {
  const { username, ticketNumber, name } = user

  const TITLE = `${name ? name + '’s' : 'Get your'} #SupaLaunchWeek Ticket`
  const DESCRIPTION =
    'Supabase Launch Week 8 | 7–11 August 2023 | Generate your ticket & win awesome swag.'
  const OG_URL = `${SITE_URL}/tickets/${username}`

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const { isDarkMode, toggleTheme } = useTheme()
  const [initialDarkMode] = useState(isDarkMode)

  const [pageState, setPageState] = useState<PageState>('ticket')

  if (!ticketNumber) {
    return <Error statusCode={404} />
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
          url: OG_URL,
          images: [
            {
              url: ogImageUrl,
              width: 1200,
              height: 630,
            },
          ],
        }}
      />
      <ConfDataContext.Provider
        value={{
          supabase,
          session,
          userData: user,
          setUserData: () => null,
          setPageState,
        }}
      >
        <DefaultLayout>
          <div className="-mt-[65px]">
            <div className="relative">
              <div className="relative z-10">
                <SectionContainer className="relative z-10 flex flex-col justify-around items-center gap-2 lg:!pb-0 md:gap-4 !px-2 !mx-auto md:min-h-[auto]">
                  <div className="pt-12 lg:pt-24">
                    {supabase && (
                      <TicketContainer
                        user={user}
                        referrals={user.referrals ?? 0}
                        supabase={supabase}
                        sharePage
                      />
                    )}
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
            </div>
            <SectionContainer className="">
              <LaunchWeekPrizeSection />
            </SectionContainer>
            {users && <TicketBrickWall users={users.slice(0, 17)} />}
          </div>
          <CTABanner className="!bg-[#020405] border-t-0" />
        </DefaultLayout>
      </ConfDataContext.Provider>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const username = params?.username?.toString() || null
  let user

  // fetch users for the TicketBrickWall
  const { data: users } = await supabaseAdmin!.from('lw8_tickets_golden').select().limit(17)

  fetch(
    `https://obuldanrptloktxcffvn.functions.supabase.co/lw8-ticket?username=${encodeURIComponent(
      username ?? ''
    )}`
  ).catch((_) => {})

  // fetch a specific user
  if (username) {
    const { data } = await supabaseAdmin!
      .from('lw8_tickets_golden')
      .select('name, username, ticketNumber, metadata, golden')
      .eq('username', username)
      .single()

    user = data
  }

  const BUCKET_FOLDER_VERSION = 'v1'

  const ogImageUrl = `https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lw8/og/${
    user?.golden ? 'golden' : 'regular'
  }/${BUCKET_FOLDER_VERSION}/${username}.png`

  return {
    props: {
      user: {
        ...user,
        username,
      },
      ogImageUrl,
      users,
      key: username,
    },
    revalidate: 5,
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  return Promise.resolve({
    paths: [],
    fallback: 'blocking',
  })
}

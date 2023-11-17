import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'
import { createClient, Session, SupabaseClient } from '@supabase/supabase-js'
import { SITE_ORIGIN, SITE_URL } from '~/lib/constants'

import DefaultLayout from '~/components/Layouts/Default'
import { PageState, ConfDataContext, UserData } from '~/components/LaunchWeek/hooks/use-conf-data'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { LaunchWeekLogoHeader } from '~/components/LaunchWeek/8/LaunchWeekLogoHeader'
import { Meetup } from '~/components/LaunchWeek/8/LW8Meetups'
import LW8CalloutsSection from '~/components/LaunchWeek/8/LW8CalloutsSection'

import { useTheme } from 'next-themes'

import 'swiper/swiper.min.css'
import X from '../../components/LaunchWeek/X/X'

const LW8Releases = dynamic(() => import('~/components/LaunchWeek/8/Releases'))
const LWXTicketContainer = dynamic(() => import('~/components/LaunchWeek/X/Ticket/TicketContainer'))
const LW8Meetups = dynamic(() => import('~/components/LaunchWeek/8/LW8Meetups'))
const LWArchive = dynamic(() => import('~/components/LaunchWeek/8/LWArchive'))
const LaunchWeekPrizeSection = dynamic(
  () => import('~/components/LaunchWeek/8/LaunchWeekPrizeSection')
)
const TicketBrickWall = dynamic(() => import('~/components/LaunchWeek/8/TicketBrickWall'))
const CTABanner = dynamic(() => import('~/components/CTABanner'))

interface Props {
  users?: UserData[]
  meetups?: Meetup[]
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_MISC_USE_URL ?? 'http://localhost:54321',
  // ANON KEY
  process.env.NEXT_PUBLIC_MISC_USE_ANON_KEY!
)

export default function TicketHome({ users, meetups }: Props) {
  const { query } = useRouter()

  const TITLE = 'Supabase Launch Week X'
  const DESCRIPTION = 'Supabase Launch Week X | 11-15 December 2023'
  const OG_IMAGE = `${SITE_ORIGIN}/images/launchweek/8/lw8-og.jpg`

  const ticketNumber = query.ticketNumber?.toString()
  const bgImageId = query.bgImageId?.toString()
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [session, setSession] = useState<Session | null>(null)

  const [initialDarkMode] = useState('dark')

  const defaultUserData = {
    id: query.id?.toString(),
    ticketNumber: ticketNumber ? parseInt(ticketNumber, 10) : undefined,
    name: query.name?.toString(),
    username: query.username?.toString(),
    golden: !!query.golden,
    bgImageId: bgImageId ? parseInt(bgImageId, 10) : undefined,
  }

  const [userData, setUserData] = useState<UserData>(defaultUserData)
  const [_, setPageState] = useState<PageState>('ticket')

  console.log('lwx session', session)
  useEffect(() => {
    if (!supabase) {
      setSupabase(
        createClient(
          process.env.NEXT_PUBLIC_MISC_USE_URL!,
          process.env.NEXT_PUBLIC_MISC_USE_ANON_KEY!
        )
      )
    }
  }, [])

  useEffect(() => {
    console.log('supabase lwx page', supabase)
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('onAuthStateChange event', event)
        console.log('onAuthStateChange session', session)
        setSession(session)
      })

      return () => subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    document.body.classList.add('bg-[#020405]')

    return () => {
      if (document.body.classList.contains('bg-[#020405]')) {
        document.body.classList.remove('bg-[#020405]')
      }
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
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </Head>
      <ConfDataContext.Provider
        value={{
          supabase,
          session,
          userData,
          setUserData,
          setPageState,
        }}
      >
        <DefaultLayout>
          <SectionContainer className="flex flex-col items-center gap-20">
            <div className="flex flex-col items-center gap-6">
              <X className="w-20 h-20" />
              <div className="flex items-center justify-center font-mono uppercase">
                Launch Week
              </div>
            </div>
            <LWXTicketContainer supabase={supabase} user={userData} />
          </SectionContainer>
        </DefaultLayout>
      </ConfDataContext.Provider>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  // fetch users for the TicketBrickWall
  const { data: users } = await supabaseAdmin!
    .from('lwx_tickets_golden')
    .select('username, golden')
    .limit(17)

  const { data: meetups } = await supabaseAdmin!.from('lw8_meetups').select('*')

  return {
    props: {
      users,
      meetups,
    },
  }
}

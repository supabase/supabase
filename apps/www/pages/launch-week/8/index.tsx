import 'swiper/css'

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
import { TicketState, ConfDataContext, UserData } from '~/components/LaunchWeek/hooks/use-conf-data'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { LaunchWeekLogoHeader } from '~/components/LaunchWeek/8/LaunchWeekLogoHeader'
import { Meetup } from '~/components/LaunchWeek/8/LW8Meetups'
import LW8CalloutsSection from '~/components/LaunchWeek/8/LW8CalloutsSection'
import AnimatedParticles from '~/components/LaunchWeek/8/AnimatedParticles/ParticlesCanvas'

const LW8Releases = dynamic(() => import('~/components/LaunchWeek/8/Releases'))
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

  const TITLE = 'Supabase Launch Week 8'
  const DESCRIPTION = 'Supabase Launch Week 8 | 7–11 August 2023'
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
  const [ticketState, setTicketState] = useState<TicketState>('ticket')

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
          ticketState,
          setTicketState,
        }}
      >
        <DefaultLayout>
          <div className="-mt-[65px]">
            <div className="relative">
              <div className="relative z-10">
                <SectionContainer className="relative flex flex-col justify-around items-center min-h-[500px] !py-4 md:!py-8 lg:!pb-0 gap-2 md:gap-4 !px-0 !mx-auto">
                  <div className="absolute bottom-0 z-10 w-full flex flex-col items-center justify-end gap-4 px-6">
                    <LaunchWeekLogoHeader />
                  </div>
                  <div className="absolute inset-0 z-0 flex items-center justify-center">
                    <AnimatedParticles />
                    <Image
                      src="/images/launchweek/8/stars.svg"
                      alt="starts background"
                      width={600}
                      height={600}
                      className="absolute inset-0 opacity-70 object-cover pointer-events-none w-auto h-auto"
                      draggable={false}
                    />
                  </div>
                </SectionContainer>
              </div>
              <div className="absolute w-full aspect-[1/1] md:aspect-[1.5/1] lg:aspect-[2.5/1] inset-0 z-0">
                <Image
                  src="/images/launchweek/8/LW8-gradient.png"
                  fill
                  className="object-cover object-top"
                  priority
                  draggable={false}
                  alt="Launch Week 8 gradient background"
                />
              </div>
            </div>

            <div id="twitter-spaces">
              <SectionContainer className="!pt-10 lg:!pt-14 !pb-0" id="hackathon">
                <LW8CalloutsSection />
              </SectionContainer>
            </div>

            <SectionContainer className="!pt-0">
              <LW8Releases />
            </SectionContainer>

            <SectionContainer id="meetups" className="!pt-0">
              <LW8Meetups meetups={meetups} />
            </SectionContainer>

            <SectionContainer id="archive">
              <LWArchive />
            </SectionContainer>

            <SectionContainer className="!px-4 w-full">
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

export const getServerSideProps: GetServerSideProps = async () => {
  // fetch users for the TicketBrickWall
  const { data: users } = await supabaseAdmin!
    .from('lw8_tickets_golden')
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

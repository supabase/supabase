import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
// import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'
import { Session } from '@supabase/supabase-js'
import { LW13_DATE, LW13_TITLE, LW_URL, SITE_ORIGIN } from '~/lib/constants'
import supabase from '~/lib/supabase'

import DefaultLayout from '~/components/Layouts/Default'
import { TicketState, ConfDataContext, UserData } from '~/components/LaunchWeek/hooks/use-conf-data'
import SectionContainer from '~/components/Layouts/SectionContainer'
// import { Meetup } from '~/components/LaunchWeek/13/LWMeetups'
import LWStickyNav from '~/components/LaunchWeek/13/Releases/LWStickyNav'
import LWHeader from '~/components/LaunchWeek/13/Releases/LWHeader'
import MainStage from '~/components/LaunchWeek/13/Releases/MainStage'

const BuildStage = dynamic(() => import('~/components/LaunchWeek/13/Releases/BuildStage'))
const CTABanner = dynamic(() => import('~/components/CTABanner'))
const TicketingFlow = dynamic(() => import('~/components/LaunchWeek/13/Ticket/TicketingFlow'))
// const LW13Meetups = dynamic(
//   () => import('~/components/LaunchWeek/13/LWMeetups')
// )

export default function LaunchWeekIndex() {
  const { query } = useRouter()

  const TITLE = `${LW13_TITLE} | ${LW13_DATE}`
  const DESCRIPTION = 'Join us for a week of announcing new features, every day at 7 AM PT.'
  const OG_IMAGE = `${SITE_ORIGIN}/images/launchweek/12/lw13-og.png?lw=12`

  const ticketNumber = query.ticketNumber?.toString()
  const [session, setSession] = useState<Session | null>(null)
  const [showCustomizationForm, setShowCustomizationForm] = useState<boolean>(false)

  const defaultUserData = {
    id: query.id?.toString(),
    ticket_number: ticketNumber ? parseInt(ticketNumber, 10) : undefined,
    name: query.name?.toString(),
    username: query.username?.toString(),
    platinum: !!query.platinum,
  }

  const [userData, setUserData] = useState<UserData>(defaultUserData)
  const [ticketState, setTicketState] = useState<TicketState>('loading')

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
      })

      return () => subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (session?.user) {
      if (userData?.id) {
        return setTicketState('ticket')
      }
      return setTicketState('loading')
    }
    if (!session) return setTicketState('registration')
  }, [session, userData])

  return (
    <>
      <NextSeo
        title={TITLE}
        description={DESCRIPTION}
        openGraph={{
          title: TITLE,
          description: DESCRIPTION,
          url: LW_URL,
          images: [
            {
              url: OG_IMAGE,
            },
          ],
        }}
      />
      <ConfDataContext.Provider
        value={{
          supabase,
          session,
          userData,
          setUserData,
          ticketState,
          setTicketState,
          showCustomizationForm,
          setShowCustomizationForm,
        }}
      >
        <DefaultLayout>
          <LWStickyNav />
          <LWHeader />
          <MainStage className="relative z-10" />
          <BuildStage />
          {/* <SectionContainer id="meetups" className="scroll-mt-[60px] lw-nav-anchor">
            <LW13Meetups meetups={meetups} />
          </SectionContainer> */}
          <SectionContainer
            className="relative !max-w-none border-t border-muted !py-8 scroll-mt-[60px] lw-nav-anchor overflow-hidden"
            id="ticket"
          >
            <TicketingFlow />
          </SectionContainer>
          <CTABanner />
        </DefaultLayout>
      </ConfDataContext.Provider>
    </>
  )
}

// export const getServerSideProps: GetServerSideProps = async () => {
//   const { data: meetups } = await supabase!
//     .from('meetups')
//     .select('*')
//     .eq('launch_week', 'lw13')
//     .neq('is_published', false)
//     .order('start_at')

//   return {
//     props: {
//       meetups,
//     },
//   }
// }

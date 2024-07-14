import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'
import { Session } from '@supabase/supabase-js'
import { SITE_ORIGIN, LW_URL } from '~/lib/constants'
import supabase from '~/lib/supabaseMisc'

import DefaultLayout from '~/components/Layouts/Default'
import { TicketState, ConfDataContext, UserData } from '~/components/LaunchWeek/hooks/use-conf-data'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { Meetup } from '~/components/LaunchWeek/11/LW11Meetups'

const TicketingFlow = dynamic(() => import('~/components/LaunchWeek/12/Ticket/TicketingFlow'))

interface Props {
  meetups?: Meetup[]
}

export default function LaunchWeekIndex({ meetups }: Props) {
  const { query } = useRouter()

  const TITLE = 'Supabase GA Week | 15-19 April 2024'
  const DESCRIPTION = 'Join us for a week of announcing new features, every day at 7 AM PT.'
  const OG_IMAGE = `${SITE_ORIGIN}/images/launchweek/11/lw11-og-ga.png`

  const ticketNumber = query.ticketNumber?.toString()
  const bgImageId = query.bgImageId?.toString()
  const [session, setSession] = useState<Session | null>(null)
  const [showCustomizationForm, setShowCustomizationForm] = useState<boolean>(false)

  const defaultUserData = {
    id: query.id?.toString(),
    ticketNumber: ticketNumber ? parseInt(ticketNumber, 10) : undefined,
    name: query.name?.toString(),
    username: query.username?.toString(),
    golden: !!query.golden,
    bgImageId: bgImageId ? parseInt(bgImageId, 10) : undefined,
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
        <DefaultLayout className="bg-alternative">
          <SectionContainer className="!pb-8" id="ticket">
            <TicketingFlow />
          </SectionContainer>
        </DefaultLayout>
      </ConfDataContext.Provider>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  const { data: meetups } = await supabase!
    .from('lw11_meetups')
    .select('*')
    .neq('isPublished', false)

  return {
    props: {
      meetups: meetups?.sort((a, b) => (new Date(a.start_at) > new Date(b.start_at) ? 1 : -1)),
    },
  }
}

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'
import { Session, SupabaseClient, createClient } from '@supabase/supabase-js'
import { SITE_ORIGIN, SITE_URL } from '~/lib/constants'
// import supabase from '~/lib/supabaseMisc'

import DefaultLayout from '~/components/Layouts/Default'
import { PageState, ConfDataContext, UserData } from '~/components/LaunchWeek/hooks/use-conf-data'
import SectionContainer from '~/components/Layouts/SectionContainer'

import X from '../../components/LaunchWeek/X/X'

const LWXTicketContainer = dynamic(() => import('~/components/LaunchWeek/X/Ticket/TicketContainer'))

export default function TicketHome() {
  const { query } = useRouter()

  console.log('query', query)

  const TITLE = 'Supabase Launch Week X'
  const DESCRIPTION = 'Supabase Launch Week X | 11-15 December 2023'
  const OG_IMAGE = `${SITE_ORIGIN}/images/launchweek/8/lw8-og.jpg`

  const ticketNumber = query.ticketNumber?.toString()
  const bgImageId = query.bgImageId?.toString()
  const [session, setSession] = useState<Session | null>(null)
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)

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
    console.log('userData', userData)
  }, [userData])

  useEffect(() => {
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
            <div className="flex flex-col items-center gap-6 text-light">
              <X className="w-20 h-20" />
              <div className="flex items-center justify-center font-mono uppercase">
                Supabase Launch Week
              </div>
            </div>
            <LWXTicketContainer supabase={supabase} user={userData} />
          </SectionContainer>
        </DefaultLayout>
      </ConfDataContext.Provider>
    </>
  )
}

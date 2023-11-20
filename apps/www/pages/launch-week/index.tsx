'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'
import { Session } from '@supabase/supabase-js'
import { LWX_DATE, LWX_LAUNCH_DATE, SITE_ORIGIN, SITE_URL } from '~/lib/constants'
import supabase from '~/lib/supabaseMisc'

import DefaultLayout from '~/components/Layouts/Default'
import { TicketState, ConfDataContext, UserData } from '~/components/LaunchWeek/hooks/use-conf-data'
import SectionContainer from '~/components/Layouts/SectionContainer'
import CountdownComponent from '../../components/LaunchWeek/X/Countdown'

import TicketForm from '../../components/LaunchWeek/X/Ticket/TicketForm'
import { AnimatePresence, motion } from 'framer-motion'
import { DEFAULT_TRANSITION, INITIAL_BOTTOM, getAnimation } from '../../lib/animations'
import LWXBackground from '../../components/LaunchWeek/X/LWXBackground'

const LWXTicketContainer = dynamic(() => import('~/components/LaunchWeek/X/Ticket/TicketContainer'))
// const LWXCountdown = dynamic(() => import('~/components/LaunchWeek/X/Countdown'))

export default function TicketHome() {
  const { query } = useRouter()

  const TITLE = 'Supabase Launch Week X'
  const DESCRIPTION = 'Supabase Launch Week X | 11-15 December 2023'
  const OG_IMAGE = `${SITE_ORIGIN}/images/launchweek/8/lw8-og.jpg`

  const ticketNumber = query.ticketNumber?.toString()
  const bgImageId = query.bgImageId?.toString()
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
  const [ticketState, setTicketState] = useState<TicketState>('loading')

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

  const transition = DEFAULT_TRANSITION
  const initial = INITIAL_BOTTOM
  const animate = getAnimation({ duration: 1 })
  const exit = { opacity: 0, transition: { ...transition, duration: 0.2 } }

  useEffect(() => {
    console.log(userData)
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
          <SectionContainer className="flex flex-col items-center gap-5 md:gap-10 text-center">
            <h1 className="sr-only">Supabase Launch Week X | {LWX_DATE}</h1>
            <div className="flex flex-col items-center gap-6 text-light">
              <CountdownComponent date={LWX_LAUNCH_DATE} showCard={false} />
            </div>
            <div className="relative w-full flex flex-col justify-center items-center gap-5 md:gap-10 text-center">
              <AnimatePresence exitBeforeEnter>
                {ticketState === 'loading' && (
                  <motion.div
                    key="loading"
                    initial={initial}
                    animate={animate}
                    exit={exit}
                    className="w-full flex flex-col items-center gap-6 text-foreground"
                  >
                    <div className="w-full min-h-[350px] flex items-center justify-center">
                      <LWXBackground />
                    </div>
                    <div className="hidden">
                      <TicketForm />
                    </div>
                  </motion.div>
                )}
                {ticketState === 'registration' && (
                  <motion.div
                    key="registration"
                    initial={initial}
                    animate={animate}
                    exit={exit}
                    className="relative w-full flex flex-col items-center gap-6 text-foreground"
                  >
                    <div className="w-full min-h-[400px] flex items-center" />
                    <div className="flex flex-col items-center justify-center font-mono uppercase gap-0 leading-0">
                      <span className="text-lg">Supabase Launch Week</span>
                      <span>{LWX_DATE}</span>
                    </div>
                    <p className="text-foreground-lighter">
                      Join us in a week of announcing new features,
                      <br className="hidden md:block" /> and find new ways to level up your
                      development.
                    </p>
                    {!userData.username && <TicketForm />}
                    <LWXBackground className="absolute top-0 left-0 right-0 w-full !min-h-[350px] flex items-center justify-center" />
                  </motion.div>
                )}
                {ticketState === 'ticket' && (
                  <motion.div
                    key="ticket"
                    initial={initial}
                    animate={animate}
                    exit={exit}
                    className="w-full flex flex-col items-center gap-6 text-foreground"
                  >
                    <div className="w-full min-h-[400px] flex items-center">
                      <LWXTicketContainer supabase={supabase} />
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2 max-w-lg">
                      <span className="text-lg">Share your ticket & win swag</span>
                      <span className="text-foreground-lighter">
                        Boost your chances of winning Supabase LWX limited-edition Keyboard and many
                        other awards.
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </SectionContainer>
        </DefaultLayout>
      </ConfDataContext.Provider>
    </>
  )
}

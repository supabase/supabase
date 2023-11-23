import React from 'react'
import { AnimatePresence, m, LazyMotion, domAnimation } from 'framer-motion'
import { DEFAULT_TRANSITION, INITIAL_BOTTOM, getAnimation } from '~/lib/animations'
import { LWX_DATE, LWX_LAUNCH_DATE } from '~/lib/constants'

import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import SectionContainer from '~/components/Layouts/SectionContainer'
import TicketContainer from '~/components/LaunchWeek/X/Ticket/TicketContainer'
import LWXBackground from '../LWXBackground'
import TicketForm from './TicketForm'
import CountdownComponent from '../Countdown'
import LaunchWeekPrizeSection from '../LaunchWeekPrizeSection'
import { Button } from 'ui'
import AddToCalendar from '../AddToCalendar'

const TicketingFlow = () => {
  const { supabase, ticketState, userData } = useConfData()

  const transition = DEFAULT_TRANSITION
  const initial = INITIAL_BOTTOM
  const animate = getAnimation({ duration: 1 })
  const exit = { opacity: 0, transition: { ...transition, duration: 0.2 } }

  return (
    <>
      <SectionContainer className="relative flex flex-col lg:pt-20 items-center gap-5 text-center h-[886px] min-h-[886px]">
        <h1 className="sr-only">Supabase Launch Week X | {LWX_DATE}</h1>
        <div className="flex flex-col items-center gap-1 text-light font-mono uppercase ">
          <span className="text-lg text-foreground tracking-[3px]">Launch Week X</span>
          <CountdownComponent date={LWX_LAUNCH_DATE} showCard={false} />
          {/* <AddToCalendar /> */}
        </div>
        <div className="relative min-h-[634px] z-10 w-full flex flex-col justify-center items-center gap-5 md:gap-10 text-center">
          <LazyMotion features={domAnimation}>
            <AnimatePresence exitBeforeEnter key={ticketState}>
              {ticketState === 'loading' && (
                <m.div
                  key="loading"
                  initial={exit}
                  animate={animate}
                  exit={exit}
                  className="relative w-full flex flex-col items-center gap-6 text-foreground"
                >
                  <div className="hidden">
                    <TicketForm />
                  </div>
                  {/* <LWXBackground className="absolute top-0 left-0 right-0 w-full !min-h-[350px] flex items-center justify-center" /> */}
                </m.div>
              )}
              {ticketState === 'registration' && (
                <m.div
                  key="registration"
                  initial={initial}
                  animate={animate}
                  exit={exit}
                  className="relative w-full flex flex-col items-center gap-6 text-foreground"
                >
                  <div className="w-full min-h-[400px] flex items-center" />
                  <div className="flex flex-col items-center justify-center font-mono uppercase gap-0 leading-0">
                    {/* <span className="text-lg">Supabase Launch Week</span> */}
                    <span>{LWX_DATE}</span>
                  </div>
                  <p className="text-foreground-lighter">
                    Join us in a week of announcing new features,
                    <br className="hidden md:block" /> and find new ways to level up your
                    development.
                  </p>
                  {!userData.username && <TicketForm />}
                  {/* <LWXBackground className="absolute top-0 left-0 right-0 w-full !min-h-[350px] flex items-center justify-center" /> */}
                </m.div>
              )}
              {ticketState === 'ticket' && (
                <m.div
                  key="ticket"
                  initial={initial}
                  animate={animate}
                  exit={exit}
                  className="w-full flex flex-col items-center gap-4 md:gap-10 text-foreground"
                >
                  <div className="w-full min-h-[400px] flex flex-col items-center">
                    <TicketContainer supabase={supabase} />
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2 max-w-lg">
                    <span className="text-2xl">
                      {userData.golden ? "You're a supa-champ 💪" : 'Share your ticket & win swag'}
                    </span>
                    <span className="text-foreground-lighter">
                      {userData.golden
                        ? 'Stay tuned on Launch Week X final day to find out if you won.'
                        : 'Boost your chances of winning Launch Week X limited-edition swag and stay tuned for a week of announcing new features.'}
                    </span>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </LazyMotion>
        </div>
        <LWXBackground className="absolute z-0 top-0 left-0 right-0 w-full h-[620px] md:h-[720px] !min-h-[350px] flex items-center justify-center" />
      </SectionContainer>
      <SectionContainer className="!pt-4 lg:pb-40">
        <LaunchWeekPrizeSection />
      </SectionContainer>
    </>
  )
}

export default TicketingFlow

import React from 'react'
import { AnimatePresence, m, LazyMotion, domAnimation } from 'framer-motion'
import { cn } from 'ui'
import { DEFAULT_TRANSITION, INITIAL_BOTTOM, getAnimation } from '~/lib/animations'
import { LW13_DATE } from '~/lib/constants'

import CanvasSingleMode from '~/components/LaunchWeek/13/Multiplayer/CanvasSingleMode'
import ThreeTicketCanvas from '~/components/LaunchWeek/13/ThreeTicketCanvas'
import SectionContainer from '~/components/Layouts/SectionContainer'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import useWinningChances from '~/components/LaunchWeek/hooks/useWinningChances'

import TicketForm from '~/components/LaunchWeek/13/Ticket/TicketForm'
import TicketSwagCtaBox from '~/components/LaunchWeek/13/Ticket/TicketSwagCtaBox'
import TicketPresence from './TicketPresence'

const TicketingFlow = () => {
  const { ticketState, userData } = useConfData()

  const isLoading = ticketState === 'loading'
  const isRegistering = ticketState === 'registration'
  const hasTicket = ticketState === 'ticket'
  const hasPlatinumTicket = userData.platinum
  const hasSecretTicket = userData.secret
  const ticketType = hasSecretTicket ? 'secret' : hasPlatinumTicket ? 'platinum' : 'regular'

  const transition = DEFAULT_TRANSITION
  const initial = INITIAL_BOTTOM
  const animate = getAnimation({ duration: 1 })
  const exit = { opacity: 0, transition: { ...transition, duration: 0.2 } }

  const winningChances = useWinningChances()

  const DISPLAY_NAME = userData?.name || userData?.username
  const FIRST_NAME = DISPLAY_NAME?.split(' ')[0]

  return (
    <>
      <SectionContainer className="relative h-full lg:min-h-[600px] lg:max-h-[600px] flex-1 pointer-events-none">
        <div className="relative z-10 flex items-center h-full">
          <h1 className="sr-only">Supabase Launch Week 13 | {LW13_DATE}</h1>
          <LazyMotion features={domAnimation}>
            <AnimatePresence mode="wait" key={ticketState}>
              {isLoading && (
                <m.div
                  key="loading"
                  initial={exit}
                  animate={animate}
                  exit={exit}
                  className="relative w-full lg:min-h-[400px] max-h-[400px] mx-auto py-16 md:py-24 flex flex-col items-center gap-6 text-foreground"
                >
                  <div className="hidden">
                    <TicketForm />
                  </div>
                  <svg
                    className="animate-spinner opacity-50 w-5 h-5 md:w-6 md:h-6"
                    width="100%"
                    height="100%"
                    viewBox="0 0 62 61"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M61 31C61 14.4315 47.5685 1 31 1C14.4315 1 1 14.4315 1 31"
                      stroke="white"
                      strokeWidth="2"
                    />
                  </svg>
                </m.div>
              )}
              {isRegistering && (
                <m.div
                  key="registration"
                  initial={initial}
                  animate={animate}
                  exit={exit}
                  className={cn(
                    'mx-auto w-full max-w-4xl lg:min-h-[400px] max-h-[400px] h-full text-left grid md:grid-cols-2 justify-center gap-8 xl:gap-24 opacity-0 invisible',
                    !hasTicket && 'opacity-100 visible',
                    'justify-items-end'
                  )}
                >
                  <div className="h-full w-full max-w-xs md:max-w-none flex flex-col justify-center gap-2 md:gap-6">
                    <div className="flex flex-col gap-2 md:gap-6">
                      <div className="flex flex-col flex-wrap gap-0">
                        <h2 className="text-foreground uppercase tracking-wider text-2xl">
                          Launch Week 13
                        </h2>
                        <p className="text-foreground-lighter uppercase tracking-wider text-xl md:text-2xl">
                          {LW13_DATE}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 text-foreground-lighter text-sm xl:text-base">
                        You can still claim a ticket thoughout the week.
                      </div>
                      <div className="flex flex-col md:flex-row gap-4 mt-2 md:mt-0 items-start md:items-center">
                        <TicketPresence className="opacity-0 invisible translate-y-1 transition-all" />
                      </div>
                    </div>
                  </div>
                  <div className="h-full min-h-[400px] aspect-[0.8/1] rounded-lg border border-dashed border-strong flex items-center justify-center bg-surface-75/25 backdrop-blur-xl">
                    <TicketForm />
                  </div>
                </m.div>
              )}
              {hasTicket && (
                <m.div
                  key="ticket"
                  initial={initial}
                  animate={animate}
                  exit={exit}
                  className="w-full max-w-5xl mx-auto lg:min-h-[400px] xl:pl-8 h-full flex flex-col lg:flex-row items-center lg:justify-start gap-8 md:gap-10 lg:gap-32 text-foreground text-center md:text-left"
                >
                  <div className="order-first lg:h-full w-full max-w-md xl:max-w-2xl gap-8 flex flex-col items-center justify-center lg:items-start lg:justify-center text-center lg:text-left">
                    <div className="flex flex-col gap-1 max-w-md">
                      {/* Header */}
                      <div className="text-2xl">
                        {hasPlatinumTicket ? (
                          hasSecretTicket ? (
                            <p>Got the gold ticket, {FIRST_NAME}!</p>
                          ) : (
                            <p>Good to see you, {FIRST_NAME}!</p>
                          )
                        ) : winningChances !== 2 ? (
                          <>
                            {hasSecretTicket && <p>{FIRST_NAME}, you're gold!</p>}
                            {!hasSecretTicket && <p>Good to see you, {FIRST_NAME}!</p>}
                          </>
                        ) : (
                          <p>Good to see you, {FIRST_NAME}!</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-4 mt-2 md:mt-0 md:mb-12 items-center lg:items-start">
                      <TicketSwagCtaBox />
                      <TicketPresence className="opacity-0 invisible translate-y-1 transition-all" />
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </LazyMotion>
        </div>
      </SectionContainer>
      <CanvasSingleMode />
      {hasTicket && (
        <ThreeTicketCanvas
          username={DISPLAY_NAME ?? ''}
          ticketType={ticketType}
          className="relative -mt-44 -mb-10 lg:my-0 lg:absolute"
        />
      )}
    </>
  )
}

export default TicketingFlow

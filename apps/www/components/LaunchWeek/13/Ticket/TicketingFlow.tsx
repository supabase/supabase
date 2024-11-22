import React from 'react'
import { AnimatePresence, m, LazyMotion, domAnimation } from 'framer-motion'
import { Button, cn } from 'ui'
import { DEFAULT_TRANSITION, INITIAL_BOTTOM, getAnimation } from '~/lib/animations'
import { LW13_DATE, LW13_LAUNCH_DATE } from '~/lib/constants'

import CountdownComponent from '~/components/LaunchWeek/13/Countdown'
import CanvasPartyMode from '~/components/LaunchWeek/13/Multiplayer/CanvasPartyMode'
import CanvasSingleMode from '~/components/LaunchWeek/13/Multiplayer/CanvasSingleMode'
import ThreeTicketCanvas from '~/components/LaunchWeek/13/ThreeTicketCanvas'
import SectionContainer from '~/components/Layouts/SectionContainer'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import useLWPartyMode from '~/components/LaunchWeek/13/useLWPartyMode'
import useWinningChances from '~/components/LaunchWeek/hooks/useWinningChances'

import TicketForm from '~/components/LaunchWeek/13/Ticket/TicketForm'
import TicketSwagCtaBox from '~/components/LaunchWeek/13/Ticket/TicketSwagCtaBox'
import TicketPresence from './TicketPresence'

const TicketingFlow = () => {
  const { ticketState, userData } = useConfData()
  const { isPartyMode, setIsPartyMode } = useLWPartyMode()

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

  const PartyModeButton = () => (
    <Button
      size="small"
      onClick={() => setIsPartyMode(!isPartyMode)}
      type="default"
      className="sm:pl-1 pointer-events-auto cursor-none"
    >
      <div className="flex items-center">
        <div className="relative h-6 w-6 border rounded bg-surface-75 mr-2 uppercase hidden sm:flex items-center justify-center">
          P
        </div>
        Party Mode: {isPartyMode ? 'On 🎉' : 'Off 😴'}
      </div>
    </Button>
  )

  return (
    <>
      <SectionContainer className="relative h-full lg:min-h-[calc(100dvh-65px)] flex-1 pointer-events-none">
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
                    'w-full lg:min-h-[600px] max-h-[400px] h-full text-left grid md:grid-cols-2 justify-center gap-8 opacity-0 invisible',
                    !hasTicket && 'opacity-100 visible'
                  )}
                >
                  <div className="h-full max-w-xs flex flex-col justify-center gap-2 md:gap-6">
                    <CountdownComponent
                      date={LW13_LAUNCH_DATE}
                      showCard={false}
                      className="[&_*]:leading-4 text-foreground-lighter"
                      size="large"
                    />
                    <div className="flex flex-col gap-2 md:gap-6">
                      <div className="flex flex-col flex-wrap uppercase text-2xl tracking-wider">
                        <h2 className="text-foreground">Launch Week 13</h2>
                        <p className="text-foreground-lighter text-base">{LW13_DATE}</p>
                      </div>
                      <p className="text-foreground-lighter text-sm md:text-lg">
                        Join us for a week of new features and level up your development.
                      </p>
                      <div className="flex flex-col md:flex-row gap-4 mt-2 md:mt-0 items-start md:items-center">
                        <PartyModeButton />
                        <TicketPresence
                          className={cn(
                            'opacity-0 invisible translate-y-1 transition-all',
                            isPartyMode && 'opacity-80 visible translate-y-0'
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="h-full mx-auto min-h-[400px] aspect-[0.8/1] rounded-lg border-2 border-dashed border-strong flex items-center justify-center bg-surface-75/80 backdrop-blur-sm">
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
                  className="w-full flex-1 lg:min-h-[400px] h-full flex flex-col lg:flex-row items-center lg:justify-start lg:items-start gap-8 md:gap-10 lg:gap-32 text-foreground text-center md:text-left"
                >
                  <div className="order-first lg:h-full w-full max-w-md xl:max-w-xl gap-8 flex flex-col items-center justify-center lg:items-start lg:justify-center text-center lg:text-left">
                    <CountdownComponent
                      date={LW13_LAUNCH_DATE}
                      showCard={false}
                      className="[&_*]:leading-4 text-foreground-lighter -my-6"
                      size="large"
                    />
                    {hasPlatinumTicket ? (
                      <div>
                        {hasSecretTicket ? (
                          <p className="text-2xl mb-1">Got the secret ticket, {FIRST_NAME}!</p>
                        ) : (
                          <p className="text-2xl mb-1">Thanks for sharing, {FIRST_NAME}!</p>
                        )}
                      </div>
                    ) : winningChances !== 2 ? (
                      <div>
                        {hasSecretTicket && (
                          <p className="text-2xl mb-1">You found a secret ticket</p>
                        )}
                        {!hasSecretTicket && (
                          <p className="text-2xl mb-1">You're in, {FIRST_NAME}!</p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="text-2xl mb-1">Almost there, {FIRST_NAME}!</p>
                      </div>
                    )}
                    <TicketSwagCtaBox
                      hasSecretTicket={hasSecretTicket!}
                      hasPlatinumTicket={hasPlatinumTicket!}
                      userData={userData}
                      firstName={FIRST_NAME!}
                      className="w-full"
                    />
                    <div className="flex flex-col md:flex-row gap-4 mt-2 md:mt-0 items-start md:items-center">
                      <PartyModeButton />
                      <TicketPresence
                        className={cn(
                          'opacity-0 invisible translate-y-1 transition-all',
                          isPartyMode && 'opacity-80 visible translate-y-0'
                        )}
                      />
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </LazyMotion>
        </div>
      </SectionContainer>
      {isPartyMode ? <CanvasPartyMode /> : <CanvasSingleMode />}
      {hasTicket && (
        <ThreeTicketCanvas
          username={DISPLAY_NAME ?? ''}
          ticketType={ticketType}
          className="relative -mt-40 -mb-10 lg:my-0 lg:absolute"
        />
      )}
    </>
  )
}

export default TicketingFlow

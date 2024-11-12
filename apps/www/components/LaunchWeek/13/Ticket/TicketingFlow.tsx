import React, { useState } from 'react'
import { AnimatePresence, m, LazyMotion, domAnimation } from 'framer-motion'
import { Button, cn } from 'ui'
import { DEFAULT_TRANSITION, INITIAL_BOTTOM, getAnimation } from '~/lib/animations'
import { LW13_DATE, LW13_LAUNCH_DATE } from '~/lib/constants'

import useWinningChances from '~/components/LaunchWeek/hooks/useWinningChances'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import SectionContainer from '~/components/Layouts/SectionContainer'
import CountdownComponent from '~/components/LaunchWeek/13/Countdown'
import useLWPartyMode from '~/components/LaunchWeek/13/useLWPartyMode'
import MetalTicket from '~/components/LaunchWeek/13/MetalTicket'
import InteractiveGridParty from '~/components/LaunchWeek/13/InteractiveGridParty'
import InteractiveGridSingle from '~/components/LaunchWeek/13/InteractiveGridSingle'

import TicketForm from '~/components/LaunchWeek/13/Ticket/TicketForm'
import TicketPresence from '~/components/LaunchWeek/13/Ticket/TicketPresence'
import TicketActions from '~/components/LaunchWeek/13/Ticket/TicketActions'
import TicketCopy from '~/components/LaunchWeek/13/Ticket/TicketCopy'
import TicketActions2 from '~/components/LaunchWeek/13/Ticket/TicketActions2'

const TicketingFlow = () => {
  const { ticketState, userData, showCustomizationForm } = useConfData()
  const { isPartyMode, setIsPartyMode } = useLWPartyMode()

  const isLoading = ticketState === 'loading'
  const isRegistering = ticketState === 'registration'
  const hasTicket = ticketState === 'ticket'
  const hasPlatinumTicket = userData.platinum
  const hasSecretTicket = userData.secret

  const transition = DEFAULT_TRANSITION
  const initial = INITIAL_BOTTOM
  const animate = getAnimation({ duration: 1 })
  const exit = { opacity: 0, transition: { ...transition, duration: 0.2 } }

  const winningChances = useWinningChances()

  const DISPLAY_NAME = userData?.name || userData?.username
  const FIRST_NAME = DISPLAY_NAME?.split(' ')[0]

  return (
    <>
      <SectionContainer className="relative h-full min-h-[calc(100dvh-65px)] flex-1 pointer-events-none">
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
                  className="relative w-full min-h-[400px] max-h-[400px] mx-auto py-16 md:py-24 flex flex-col items-center gap-6 text-foreground"
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
                    'w-full min-h-[400px] max-h-[400px] h-full text-left grid md:grid-cols-2 justify-center gap-8 opacity-0 invisible',
                    !hasTicket && 'opacity-100 visible'
                  )}
                >
                  <div className="h-full max-w-sm flex flex-col justify-center gap-2 md:gap-6">
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
                        Join us for a week of new features and level up your development
                      </p>
                      <div>
                        <Button
                          size="small"
                          onClick={() => setIsPartyMode(true)}
                          type="default"
                          className="sm:pl-1 pointer-events-auto"
                        >
                          <div className="flex items-center">
                            <div className="relative h-6 w-6 border rounded bg-surface-75 mr-2 uppercase hidden sm:flex items-center justify-center">
                              P
                            </div>
                            Party Mode: {isPartyMode ? 'On' : 'Off'}
                          </div>
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="h-full mx-auto min-h-[400px] aspect-[0.8/1] rounded-lg border-2 border-dashed border-spacing-3 border-strong flex items-center justify-center bg-surface-75/80 backdrop-blur-md">
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
                  className="w-full flex-1 min-h-[400px] h-full flex flex-col xl:flex-row items-center xl:justify-center xl:items-center gap-8 md:gap-10 xl:gap-32 text-foreground text-center md:text-left"
                >
                  <div className="w-full lg:w-auto h-full mt-3 md:mt-6 xl:mt-0 max-w-lg flex flex-col items-center justify-center gap-3">
                    {/* <TicketContainer /> */}
                    <MetalTicket username="Francesco Sansalvadore" />
                    {/* {!hasPlatinumTicket && <TicketPresence />} */}
                    {/* // not sure why this was only non platinum */}
                    <TicketPresence />
                    <TicketCopy />
                  </div>
                  <div className="order-first xl:h-full w-full max-w-lg gap-8 flex flex-col items-center justify-center xl:items-start xl:justify-center text-center xl:text-left">
                    {hasPlatinumTicket ? (
                      <div>
                        {hasSecretTicket ? (
                          <p className="text-2xl mb-1">Share the secret ticket to beat the odds</p>
                        ) : (
                          <p className="text-2xl mb-1">Thanks for sharing</p>
                        )}
                        <p className="text-2xl text-foreground-light">
                          Follow Launch Week 13 announcements to find out if you're a lucky winner.
                        </p>
                      </div>
                    ) : winningChances !== 2 ? (
                      <div>
                        {hasSecretTicket && (
                          <p className="text-2xl mb-1">You found a secret ticket</p>
                        )}
                        {!hasSecretTicket && (
                          <p className="text-2xl mb-1">You're in {FIRST_NAME}!</p>
                        )}
                        <p className="text-2xl text-foreground-light">
                          Share your ticket to win limited swag.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-2xl mb-1">Almost there {FIRST_NAME}!</p>
                        <p className="text-2xl text-foreground-light">
                          Share on {!userData.shared_on_linkedin ? 'LinkedIn' : 'Twitter'} to
                          increase your chances of winning limited swag.
                        </p>
                      </div>
                    )}
                    <TicketActions2 />
                    <div className="w-full my-3">
                      <TicketActions />
                    </div>
                    <CountdownComponent date={LW13_LAUNCH_DATE} showCard={false} />
                  </div>
                </m.div>
              )}
              {/* {!showCustomizationForm && isPartyMode && (
                <m.div
                  key="ticket"
                  initial={initial}
                  animate={animate}
                  exit={exit}
                  className="w-full flex justify-center text-foreground !h-[500px]"
                >
                  <LWGame setisPartyMode={setisPartyMode} />
                </m.div>
              )} */}
            </AnimatePresence>
          </LazyMotion>
        </div>
      </SectionContainer>
      {isPartyMode ? <InteractiveGridParty /> : <InteractiveGridSingle />}
      {hasTicket && <div className="absolute inset-8">HAS_TICKET</div>}
    </>
  )
}

export default TicketingFlow

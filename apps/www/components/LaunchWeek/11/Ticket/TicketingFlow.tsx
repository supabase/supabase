import React, { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence, m, LazyMotion, domAnimation, useInView } from 'framer-motion'
import { Badge, cn } from 'ui'
import { DEFAULT_TRANSITION, INITIAL_BOTTOM, getAnimation } from '~/lib/animations'
import { LW11_DATE, LW11_LAUNCH_DATE_END } from '~/lib/constants'
import useWinningChances from '../../hooks/useWinningChances'
import useLwGame from '../../hooks/useLwGame'

import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import SectionContainer from '~/components/Layouts/SectionContainer'
import TicketContainer from '~/components/LaunchWeek/11/Ticket/TicketContainer'
import LW11Background from '../LW11Background'
import TicketForm from './TicketForm'
import CountdownComponent from '../Countdown'
import TicketActions from './TicketActions'

const LWGame = dynamic(() => import('./LW11Game'))

const TicketingFlow = () => {
  const sectionRef = useRef<HTMLDivElement>(null)
  const { ticketState, userData, showCustomizationForm } = useConfData()
  const { isGameMode, setIsGameMode } = useLwGame(ticketState !== 'ticket' || showCustomizationForm)

  const isLoading = !isGameMode && ticketState === 'loading'
  const isRegistering = !isGameMode && ticketState === 'registration'
  const hasTicket = !isGameMode && ticketState === 'ticket'
  const hasPlatinumTicket = userData.platinum
  const hasSecretTicket = userData.secret
  const metadata = userData?.metadata

  const transition = DEFAULT_TRANSITION
  const initial = INITIAL_BOTTOM
  const animate = getAnimation({ duration: 1 })
  const exit = { opacity: 0, transition: { ...transition, duration: 0.2 } }

  const winningChances = useWinningChances()

  const isInView = useInView(sectionRef)

  useEffect(() => {
    if (!isInView) setIsGameMode(false)

    return () => setIsGameMode(false)
  }, [isInView])

  return (
    <>
      <SectionContainer ref={sectionRef} className="relative !pt-8 lg:!pt-20 gap-5 h-full flex-1">
        <div className="relative z-10 flex flex-col h-full">
          <h1 className="sr-only">Supabase Special Announcement | {LW11_DATE}</h1>
          <div className="relative z-10 w-full h-full flex flex-col justify-center gap-5 md:gap-10">
            <LazyMotion features={domAnimation}>
              <AnimatePresence mode="wait" key={ticketState}>
                {isLoading && (
                  <m.div
                    key="loading"
                    initial={exit}
                    animate={animate}
                    exit={exit}
                    className="relative w-full min-h-[400px] mx-auto py-16 md:py-24 flex flex-col items-center gap-6 text-foreground"
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
                      'w-full min-h-[400px] max-w-md mx-auto flex flex-col justify-center gap-8 lg:gap-12 opacity-0 invisible',
                      !isGameMode && !hasTicket && 'opacity-100 visible'
                    )}
                  >
                    <div className="flex flex-col gap-2">
                      <h2 className="text-foreground text-2xl">Claim your ticket</h2>
                    </div>
                    <div className="flex flex-col gap-1 font-mono text-sm">
                      <span className="font-mono text-foreground-lighter text-xs leading-3">
                        Time to participate
                      </span>
                      <CountdownComponent
                        date={LW11_LAUNCH_DATE_END}
                        showCard={false}
                        className="[&_*]:leading-4"
                        size="large"
                      />
                    </div>
                    <TicketForm />
                  </m.div>
                )}
                {hasTicket && (
                  <m.div
                    key="ticket"
                    initial={initial}
                    animate={animate}
                    exit={exit}
                    className="w-full flex-1 min-h-[400px] flex flex-col xl:flex-row items-center xl:justify-center xl:items-center gap-8 md:gap-10 xl:gap-20 text-foreground text-center md:text-left"
                  >
                    <div className="w-full lg:w-auto h-full mt-3 md:mt-6 xl:mt-0 max-w-lg flex flex-col items-center">
                      <TicketContainer />
                    </div>
                    <div className="order-first xl:h-full w-full max-w-lg gap-3 flex flex-col items-center justify-center xl:items-start xl:justify-start text-center xl:text-left">
                      {hasSecretTicket && <Badge variant="outline">Secret ticket</Badge>}
                      {hasPlatinumTicket ? (
                        <div>
                          {hasSecretTicket && !metadata?.hasSharedSecret ? (
                            <p className="text-2xl mb-1">
                              Share again to boost your chance of winning!
                            </p>
                          ) : (
                            <p className="text-2xl mb-1">Thanks for sharing!</p>
                          )}
                          <p className="text-foreground-lighter">
                            Stay tuned after GA Week to find out if you're a lucky winner.
                          </p>
                        </div>
                      ) : winningChances !== 2 ? (
                        <div>
                          {!hasSecretTicket && (
                            <p className="text-2xl mb-1">@{userData.username}, you're in!</p>
                          )}
                          <p className="text-foreground-lighter">
                            Now share your ticket to have a chance of winning AirPods Max and other
                            limited swag.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-2xl mb-1">@{userData.username}, almost there!</p>
                          <p className="text-foreground-lighter">
                            Keep sharing to max out your chances of winning AirPods Max and other
                            limited swag.
                          </p>
                        </div>
                      )}
                      <div className="w-full my-3">
                        <TicketActions />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-mono text-foreground-lighter text-xs leading-3">
                          Time to participate
                        </span>
                        <CountdownComponent date={LW11_LAUNCH_DATE_END} showCard={false} />
                      </div>
                    </div>
                  </m.div>
                )}
                {isInView && !showCustomizationForm && isGameMode && (
                  <m.div
                    key="ticket"
                    initial={initial}
                    animate={animate}
                    exit={exit}
                    className="w-full flex justify-center text-foreground !h-[500px]"
                  >
                    <LWGame setIsGameMode={setIsGameMode} />
                  </m.div>
                )}
              </AnimatePresence>
            </LazyMotion>
          </div>
        </div>
      </SectionContainer>
      <LW11Background
        className={cn(
          'absolute z-0 inset-0 w-full h-full flex items-center justify-center opacity-100 transition-opacity',
          hasTicket && 'opacity-20'
        )}
      />
    </>
  )
}

export default TicketingFlow

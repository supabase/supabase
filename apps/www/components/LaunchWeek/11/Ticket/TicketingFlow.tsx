import React from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { AnimatePresence, m, LazyMotion, domAnimation } from 'framer-motion'
import { Badge, cn } from 'ui'
import { DEFAULT_TRANSITION, INITIAL_BOTTOM, getAnimation } from '~/lib/animations'
import { LW11_DATE, LW11_LAUNCH_DATE } from '~/lib/constants'
import useWinningChances from '../../hooks/useWinningChances'
import useLwGame from '../../hooks/useLwGame'

import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import SectionContainer from '~/components/Layouts/SectionContainer'
import TicketContainer from '~/components/LaunchWeek/11/Ticket/TicketContainer'
import LW11Background from '../LW11Background'
import TicketForm from './TicketForm'
import CountdownComponent from '../Countdown'
import TicketPresence from './TicketPresence'
import TicketActions from './TicketActions'

const LWGame = dynamic(() => import('./LW11Game'))

const TicketingFlow = () => {
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

  return (
    <>
      <SectionContainer className="relative !pt-8 lg:!pt-20 gap-5 h-full flex-1">
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
                      <h2 className="text-foreground text-2xl">
                        Join us for a Special Announcement
                      </h2>
                      <p className="text-foreground-lighter text-lg">
                        Celebrate a major milestone with us and explore all the features that come
                        with it.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 font-mono uppercase text-sm">
                      <p className="-mb-1">{LW11_DATE}</p>
                      <CountdownComponent
                        date={LW11_LAUNCH_DATE}
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
                          <p className="text-[#8B9092]">
                            Join on April 15-19 to celebrate a major milestone with us and explore
                            all the features that come with it.
                          </p>
                        </div>
                      ) : winningChances !== 2 ? (
                        <div>
                          {!hasSecretTicket && (
                            <p className="text-2xl mb-1">@{userData.username}, you're in!</p>
                          )}
                          <p className="text-[#8B9092]">
                            Now share your ticket to have a chance of winning AirPods Max and other
                            limited swag.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-2xl mb-1">@{userData.username}, almost there!</p>
                          <p className="text-[#8B9092]">
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
                          Starts in:
                        </span>
                        <CountdownComponent date={LW11_LAUNCH_DATE} showCard={false} />
                      </div>
                      <div className="w-full h-auto text-center md:text-left border border-muted flex flex-col md:flex-row items-stretch rounded-lg bg-surface-100 my-2 md:mb-8 overflow-hidden">
                        <div className="relative h-full w-full aspect-[4/1] border-b md:border-b-0 md:aspect-auto md:min-h-[140px] md:w-1/3 top-0 -bottom-8 overflow-visible">
                          <Image
                            src="/images/launchweek/11/airpods-max-alpha.png"
                            alt="Supabase AirPod Max prize"
                            width={300}
                            height={300}
                            draggable={false}
                            className="hidden md:block absolute p-2 object-cover object-left-top w-full h-[200px] overflow-visible opacity-50 pointer-events-none"
                          />
                          <Image
                            src="/images/launchweek/11/airpods-max-alpha-crop.png"
                            alt="Supabase AirPod Max prize"
                            draggable={false}
                            width={300}
                            height={300}
                            className="md:hidden absolute mx-auto object-cover inset-x-0 lg:object-top w-auto h-full opacity-50 pointer-events-none"
                          />
                        </div>
                        <div className="flex flex-col justify-center md:w-2/3 gap-1 p-3">
                          <p className="text-sm text-foreground-lighter">5 sets</p>
                          <p className="">Win AirPods Max</p>
                          <p className="text-foreground-light text-sm">
                            Grow your chances of winning limited edition swag by sharing on{' '}
                            <span className="text-foreground">X</span> and{' '}
                            <span className="text-foreground">Linkedin</span>.
                          </p>
                        </div>
                      </div>
                      <TicketPresence />
                    </div>
                  </m.div>
                )}
                {!showCustomizationForm && isGameMode && (
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

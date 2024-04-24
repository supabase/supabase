import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, m, LazyMotion, domAnimation } from 'framer-motion'
import { cn } from 'ui'
import { DEFAULT_TRANSITION, INITIAL_BOTTOM, getAnimation } from '~/lib/animations'
import { LWX_DATE, LWX_LAUNCH_DATE } from '~/lib/constants'
import useWinningChances from '../../hooks/useWinningChances'

import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import SectionContainer from '~/components/Layouts/SectionContainer'
import TicketContainer from '~/components/LaunchWeek/X/Ticket/TicketContainer'
import LWXBackground from '../LWXBackground'
import TicketForm from './TicketForm'
import CountdownComponent from '../Countdown'
import LaunchWeekPrizeSection from '../LaunchWeekPrizeSection'
import TicketPresence from './TicketPresence'
import TicketActions from './TicketActions'
import useLwxGame from '../../hooks/useLwGame'
import LWXGame from './LWXGame'

const TicketingFlow = () => {
  const { ticketState, userData, showCustomizationForm } = useConfData()
  const { isGameMode, setIsGameMode } = useLwxGame(showCustomizationForm)

  const isLoading = !isGameMode && ticketState === 'loading'
  const isRegistering = !isGameMode && ticketState === 'registration'
  const hasTicket = !isGameMode && ticketState === 'ticket'
  const hasPlatinumTicket = userData.golden
  const hasSecretTicket = userData.metadata?.hasSecretTicket

  const transition = DEFAULT_TRANSITION
  const initial = INITIAL_BOTTOM
  const animate = getAnimation({ duration: 1 })
  const exit = { opacity: 0, transition: { ...transition, duration: 0.2 } }

  const winningChances = useWinningChances()

  return (
    <>
      <SectionContainer className="relative flex flex-col !pt-8 lg:!pt-20 items-center gap-5 text-center h-auto lg:min-h-[886px]">
        <h1 className="sr-only">Supabase Launch Week X | {LWX_DATE}</h1>

        <div
          className={cn(
            'flex flex-col items-center gap-1 text-[#B0B0B0] font-mono uppercase transition-all opacity-0 invisible',
            !isGameMode && !hasTicket && 'opacity-100 visible'
          )}
        >
          <p className="flex items-center gap-3 leading-none">
            <span className="text-lg text-foreground tracking-[2px]">Launch Week</span>{' '}
            <Image
              src="/images/launchweek/lwx/logos/lwx_logo.svg"
              alt="Supabase Launch Week X icon"
              width={16}
              height={16}
            />
          </p>
          <CountdownComponent date={LWX_LAUNCH_DATE} showCard={false} />
        </div>
        <div className="relative min-h-[500px] md:min-h-[634px] z-10 w-full flex flex-col justify-center items-center gap-5 md:gap-10 text-center">
          <LazyMotion features={domAnimation}>
            <AnimatePresence mode="wait" key={ticketState}>
              {isLoading && (
                <m.div
                  key="loading"
                  initial={exit}
                  animate={animate}
                  exit={exit}
                  className="relative w-full -mt-5 md:mt-3 lg:mt-10 xl:mt-8 2xl:mt-6 pb-64 flex flex-col items-center gap-6 text-foreground"
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
                  className="relative w-full flex flex-col items-center gap-6 text-foreground"
                >
                  <div className="w-full min-h-[200px] md:min-h-[400px] flex items-center" />
                  <div className="flex flex-col items-center justify-center font-mono uppercase gap-0 leading-0">
                    <span>{LWX_DATE}</span>
                  </div>
                  <p className="text-[#8B9092]">
                    Join us for a week of announcing new features,
                    <br className="hidden md:block" /> and find new ways to level up your
                    development.
                  </p>
                  <TicketForm />
                  <TicketPresence />
                </m.div>
              )}
              {hasTicket && (
                <m.div
                  key="ticket"
                  initial={initial}
                  animate={animate}
                  exit={exit}
                  className="w-full flex flex-col xl:flex-row items-center xl:justify-center xl:items-start gap-8 md:gap-10 xl:gap-20 text-foreground"
                >
                  <div className="w-full ld:w-auto min-h-[400px] mt-3 md:mt-12 xl:mt-0 max-w-2xl flex flex-col items-center">
                    <TicketContainer />
                  </div>
                  <div className="order-first xl:h-full max-w-md gap-3 flex flex-col items-center justify-center xl:items-start xl:justify-start xl:text-left">
                    {hasSecretTicket ? (
                      <p className="text-2xl lg:text-3xl">
                        <span className="text-[#8B9092]">You got the secret ticket.</span> Share it
                        to increase your chances of winning even more.
                      </p>
                    ) : hasPlatinumTicket ? (
                      <p className="text-2xl lg:text-3xl">
                        <span className="text-[#8B9092]">Congrats!</span> You maximized your chances
                        and have a platinum ticket now.
                      </p>
                    ) : winningChances !== 2 ? (
                      <p className="text-2xl lg:text-3xl">
                        <span className="text-[#8B9092]">You're in!</span>{' '}
                        <span>Now share your ticket to win limited swag.</span>
                      </p>
                    ) : (
                      <p className="text-2xl lg:text-3xl">
                        <span className="text-[#8B9092]">Just one more.</span>{' '}
                        <span>Keep sharing to increase your chances.</span>
                      </p>
                    )}
                    <CountdownComponent date={LWX_LAUNCH_DATE} showCard={false} />
                    {!hasPlatinumTicket && <TicketPresence />}
                    <div className="w-full h-auto text-center md:text-left border border-muted flex flex-col md:flex-row items-stretch rounded-lg bg-[#060809] mt-2 md:mt-8 overflow-hidden">
                      <div className="flex flex-col md:w-2/3 gap-1 pb-6">
                        {hasPlatinumTicket ? (
                          <p className="p-6 pb-3">
                            Stay tuned after Launch Week X to know if you won.
                          </p>
                        ) : (
                          <p className="p-6 pb-3">
                            Win a keyboard and other{' '}
                            <Link href="#prizes" className="underline">
                              awards
                            </Link>
                            .
                          </p>
                        )}
                        <div className="w-full px-6">
                          <TicketActions />
                        </div>
                      </div>
                      <div className="hidden md:block relative h-auto w-full pl-6 pt-6">
                        <Image
                          src="/images/launchweek/lwx/swag/lwx_keyboard_preview.png"
                          alt="Supabase Launch Week X keyboard prize"
                          width={300}
                          height={300}
                          className="object-cover object-left-top w-full h-full"
                        />
                      </div>
                    </div>
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
                  <LWXGame setIsGameMode={setIsGameMode} />
                </m.div>
              )}
            </AnimatePresence>
          </LazyMotion>
        </div>

        <LWXBackground
          className={cn(
            'absolute z-0 top-0 left-0 right-0 bottom-0 w-full flex items-center justify-center opacity-100 transition-opacity',
            hasTicket && 'opacity-20'
          )}
          isGameMode={isGameMode as boolean}
        />
      </SectionContainer>
    </>
  )
}

export default TicketingFlow

import Link from 'next/link'
import { useRouter } from 'next/router'
import Telemetry, { TelemetryEvent } from '~/lib/telemetry'
import { useTelemetryProps } from 'common/hooks/useTelemetryProps'
import gaEvents from '~/lib/gaEvents'
import { Button, IconArrowRight, IconBookOpen } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import HeroFrameworks from './HeroFrameworks'
import styles from './hero.module.css'
import Image from 'next/image'
import { useEffect, useState } from 'react'

const Hero = () => {
  const router = useRouter()
  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const telemetryProps = useTelemetryProps()
  const sendTelemetryEvent = async (event: TelemetryEvent) => {
    await Telemetry.sendEvent(event, telemetryProps, router)
  }

  useEffect(() => {
    if (typeof window !== undefined) {
      const lw8AnnouncementKey = window.localStorage.getItem('announcement_SupabaseLaunchWeek8')
      setShowAnnouncement(!!lw8AnnouncementKey)
    }
  }, [showAnnouncement])

  return (
    <div className="relative -mt-[65px]">
      <SectionContainer className="py-12 md:py-16 lg:py-20 overflow-hidden">
        <div className="relative">
          <div className="mx-auto">
            <div className="mx-auto max-w-2xl lg:col-span-6 lg:flex lg:items-center justify-center text-center">
              <div
                className={[
                  'relative z-10 appear-first lg:h-auto pt-[250px] lg:pt-[250px] lg:min-h-[300px] flex flex-col items-center justify-center sm:mx-auto md:w-3/4 lg:mx-0 lg:w-full gap-4 lg:gap-8',
                  styles['hero-text'],
                ].join(' ')}
              >
                <div className="flex flex-col items-center">
                  {showAnnouncement && (
                    <Link href="/launch-week">
                      <a className="group w-auto rounded-full p-1 mb-6 mt-8 md:mb-10 bg-gradient-to-b from-[#1b1f2124] to-[#02040550] hover:from-[#ffffff15] hover:to-[#ffffff05] transition-all backdrop-blur-lg border flex items-center justify-between gap-2 md:gap-4 text-scale-1100 hover:text-scale-1200 text-sm">
                        <div className="text-scale-200 rounded-full bg-brand-900 px-3 py-1 flex items-center justify-center">
                          Get your ticket
                        </div>
                        <span>Launch Week 8 - August 7-11</span>
                        <IconArrowRight
                          size={16}
                          className="transform mr-2 transition-transform translate-x-0 sm:-translate-x-1 group-hover:translate-x-0"
                        />
                      </a>
                    </Link>
                  )}
                  <h1 className="text-scale-1200 text-4xl sm:text-5xl sm:leading-none lg:text-7xl">
                    <span className="block text-[#F4FFFA00] bg-clip-text bg-gradient-to-b from-scale-1200 to-scale-1200 dark:to-scale-1100">
                      Build in a weekend
                    </span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#3ECF8E] via-[#3ECF8E] to-[#3ecfb2] block md:ml-0">
                      Scale to millions
                    </span>
                  </h1>
                  <p className="pt-2 text-scale-1200 my-3 text-sm sm:mt-5 lg:mb-0 sm:text-base lg:text-lg">
                    Supabase is an open source Firebase alternative.{' '}
                    <br className="hidden md:block" />
                    Start your project with a Postgres database, Authentication, instant APIs, Edge
                    Functions, Realtime subscriptions, Storage, and Vector embeddings.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="https://supabase.com/dashboard"
                    as="https://supabase.com/dashboard"
                    passHref
                  >
                    <a onClick={() => sendTelemetryEvent(gaEvents['www_hp_hero_startProject'])}>
                      <Button size="medium" className="text-white">
                        Start your project
                      </Button>
                    </a>
                  </Link>
                  <Link href="/docs" as="/docs" passHref>
                    <a onClick={() => sendTelemetryEvent(gaEvents['www_hp_hero_documentation'])}>
                      <Button size="medium" type="default" icon={<IconBookOpen />}>
                        Documentation
                      </Button>
                    </a>
                  </Link>
                </div>

                <HeroFrameworks className="mt-4 lg:mt-6" />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -top-2 md:top-0 -left-10 -right-10 md:left-0 md:right-0 h-[500px] lg:h-[550px] z-0 flex items-center justify-center">
          <div className="relative w-full aspect-[1.65/1] mb-14 max-w-sm md:max-w-md opacity-0 !animate-[fadeIn_0.5s_cubic-bezier(0.25,0.25,0,1)_0.5s_both]">
            <Image
              src="/images/launchweek/8/lw8-visual.png"
              alt="launch week 8 shape"
              layout="fill"
              objectFit="contain"
              quality={100}
              draggable={false}
            />
          </div>
          <div className="absolute inset-0">
            <Image
              src="/images/launchweek/8/stars.svg"
              alt="stars background"
              layout="fill"
              objectFit="cover"
              className="opacity-70"
              draggable={false}
            />
          </div>
        </div>
      </SectionContainer>
      <div className="absolute w-full max-w-[1600px] mx-auto h-[500px] lg:h-[750px] inset-0 z-0">
        <Image
          src="/images/launchweek/8/LW8-gradient.png"
          layout="fill"
          objectFit="cover"
          objectPosition="top"
          priority
          draggable={false}
        />
      </div>
      <div className="absolute top-0 left-0 right-0 h-screen bg-gradient-to-b from-[#020405] to-transparent -z-10" />
      <div className="w-1/2 container mx-auto h-px bg-gradient-to-r from-transparent via-scale-600 to-transparent" />
    </div>
  )
}

export default Hero

import Link from 'next/link'
import { useRouter } from 'next/router'
import Telemetry, { TelemetryEvent } from '~/lib/telemetry'
import { useTelemetryProps } from 'common/hooks/useTelemetryProps'
import gaEvents from '~/lib/gaEvents'
import { Button, IconBookOpen } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import HeroFrameworks from './HeroFrameworks'
import styles from './hero.module.css'
import Image from 'next/image'
import AnnouncementBadge from '../Announcement/Badge'

const Hero = () => {
  const router = useRouter()
  const telemetryProps = useTelemetryProps()
  const sendTelemetryEvent = async (event: TelemetryEvent) => {
    await Telemetry.sendEvent(event, telemetryProps, router)
  }

  return (
    <div className="relative -mt-[65px]">
      <SectionContainer className="pt-8 md:pt-16 lg:pt-24 overflow-hidden">
        <div className="relative">
          <div className="mx-auto">
            <div className="mx-auto max-w-2xl lg:col-span-6 lg:flex lg:items-center justify-center text-center">
              <div
                className={[
                  'relative z-10 appear-first lg:h-auto pt-[90px] lg:pt-[90px] lg:min-h-[300px] flex flex-col items-center justify-center sm:mx-auto md:w-3/4 lg:mx-0 lg:w-full gap-4 lg:gap-8',
                  styles['hero-text'],
                ].join(' ')}
              >
                <div className="flex flex-col items-center">
                  <div className="z-40 w-full flex justify-center mb-8 lg:mb-8">
                    <AnnouncementBadge />
                  </div>
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
                    <a
                      onClick={() => sendTelemetryEvent(gaEvents['www_hp_hero_startProject'])}
                      tabIndex={-1}
                    >
                      <Button size="medium" className="text-white">
                        Start your project
                      </Button>
                    </a>
                  </Link>
                  <Link href="/docs" as="/docs" passHref>
                    <a
                      onClick={() => sendTelemetryEvent(gaEvents['www_hp_hero_documentation'])}
                      tabIndex={-1}
                    >
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
          <span className="absolute inset-0">
            <Image
              src="/images/launchweek/8/stars.svg"
              alt="stars background"
              layout="fill"
              objectFit="cover"
              className="opacity-70"
              draggable={false}
            />
          </span>
        </div>
      </SectionContainer>
      <div className="absolute w-full max-w-[1600px] mx-auto h-[500px] lg:h-[750px] inset-0 z-0 flex items-center justify-center">
        <Image
          src="/images/launchweek/8/LW8-gradient.png"
          alt="Launch Week 8 purple background gradient"
          className="not-sr-only"
          layout="fill"
          objectFit="cover"
          objectPosition="top"
          priority
          draggable={false}
        />
      </div>
      <div className="absolute top-0 left-0 right-0 h-screen bg-gradient-to-b from-[#020405] to-transparent -z-10" />
    </div>
  )
}

export default Hero

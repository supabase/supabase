import Link from 'next/link'
import { useRouter } from 'next/router'
import Telemetry, { TelemetryEvent } from '~/lib/telemetry'
import { useTelemetryProps } from 'common/hooks/useTelemetryProps'
import gaEvents from '~/lib/gaEvents'
import { Button, IconBookOpen } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import styles from './hero.module.css'
import { ReactNode } from 'react'

interface Props {
  heading: string | ReactNode
  subheading: string | ReactNode
  image?: string
  cta?: {
    label?: string
    link: string
  }
  secondaryCta?: {
    label?: string
    link: string
  }
}

const Hero = (props: Props) => {
  const router = useRouter()
  const telemetryProps = useTelemetryProps()
  const sendTelemetryEvent = async (event: TelemetryEvent) => {
    await Telemetry.sendEvent(event, telemetryProps, router)
  }

  return (
    <>
      <div className="relative">
        <SectionContainer className="lg:!pt-40">
          <div className="relative">
            <div className="mx-auto">
              <div className="mx-auto max-w-2xl lg:col-span-6 lg:flex lg:items-center justify-center text-center">
                <div
                  className={[
                    'appear-first h-auto flex flex-col items-center justify-center sm:mx-auto md:w-3/4 lg:mx-0 lg:w-full gap-4 lg:gap-8',
                    styles['hero-text'],
                  ].join(' ')}
                >
                  <div className="relative z-30">
                    <h1 className="text-scale-1200 text-4xl sm:text-5xl sm:leading-none lg:text-7xl">
                      <span className="block text-[#F4FFFA00] bg-clip-text bg-gradient-to-b from-scale-1200 to-scale-1200 dark:to-scale-1100">
                        Build in a weekend
                      </span>
                      <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#3ECF8E] via-[#3ECF8E] to-[#3ecfb2] block md:ml-0">
                        Scale to millions
                      </span>
                    </h1>
                    <p className="pt-2 text-[var(--color-text-secondary)] my-3 text-sm sm:mt-5 lg:mb-0 sm:text-base lg:text-lg">
                      {props.subheading}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {props.cta && (
                      <Link href={props.cta.link} as={props.cta.link}>
                        <a onClick={() => sendTelemetryEvent(gaEvents['www_hp_hero_startProject'])}>
                          <Button size="medium" className="text-white">
                            {props.cta.label ?? 'Start your project'}
                          </Button>
                        </a>
                      </Link>
                    )}
                    {props.secondaryCta && (
                      <Link href={props.secondaryCta.link} as={props.secondaryCta.link}>
                        <a
                          onClick={() => sendTelemetryEvent(gaEvents['www_hp_hero_documentation'])}
                          className="ml-2"
                        >
                          <Button size="medium" type="default" icon={<IconBookOpen />}>
                            {props.secondaryCta.label ?? 'Documentation'}
                          </Button>
                        </a>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SectionContainer>
        {/* <div className="relative z-30 w-1/2 container mx-auto h-px bg-gradient-to-r from-transparent via-scale-600 to-transparent" /> */}
      </div>
      {props.image && (
        <img
          src={props.image}
          className="absolute mx-auto top-0 left-0 right-0 z-0 w-screen aspect-[2.5/1] pointer-events-none opacity-100"
        />
      )}
    </>
  )
}

export default Hero

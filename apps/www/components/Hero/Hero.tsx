import Link from 'next/link'
import { useRouter } from 'next/router'
import Telemetry, { TelemetryEvent } from '~/lib/telemetry'
import { useTelemetryProps } from 'common/hooks/useTelemetryProps'
import gaEvents from '~/lib/gaEvents'
import { Button, IconBookOpen } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import HeroFrameworks from './HeroFrameworks'
import styles from './hero.module.css'
import Particles from './Particles'
import SBLogoVisual from './SBLogoVisual'
import { Application } from '@splinetool/runtime'
import { useEffect } from 'react'
import InteractiveShimmerCard from '../InteractiveShimmerCard'

const Hero = () => {
  const router = useRouter()
  const telemetryProps = useTelemetryProps()
  const sendTelemetryEvent = async (event: TelemetryEvent) => {
    await Telemetry.sendEvent(event, telemetryProps, router)
  }

  useEffect(() => {
    if (!document) return
    const canvas = document.getElementById('canvas3d')
    if (!canvas) return

    const spline = new Application(canvas as any)
    // spline.load('https://prod.spline.design/EVQrv4Zsx5JT2pDe/scene.splinecode').then(() => {
    spline.load('https://prod.spline.design/0Txq7YaSsBK2XeDK/scene.splinecode').then(() => {
      const obj = spline.findObjectById('ab3a4cd0-90a8-47c7-b2c7-b0ee1e0bb8a6')
      console.log(obj, spline)
      spline.setZoom(2)
    })
  }, [])

  return (
    <>
      <div className="relative">
        <SectionContainer className="pb-12 !pt-0 mt-0 md:pb-16 lg:pb-20">
          <div className="relative">
            <div className="mx-auto">
              <div className="mx-auto max-w-2xl lg:col-span-6 lg:flex lg:items-center justify-center text-center">
                <div
                  className={[
                    'appear-first h-auto flex flex-col items-center justify-center sm:mx-auto md:w-3/4 lg:mx-0 lg:w-full gap-4 lg:gap-8',
                    styles['hero-text'],
                  ].join(' ')}
                >
                  <div className="relative w-screen min-h-[200px] -mb-[50px] lg:-mb-[150px] z-10 h-[200px] lg:min-h-[350px] lg:h-[45vh]">
                    {/* <canvas
                      className="relative z-20 w-[500px] h-[500px] bottom-[-40px] lg:bottom-[-60px]"
                      id="canvas3d"
                    ></canvas> */}
                    <div
                      className="absolute w-full h-full z-50 pointer-events-none inset-0"
                      style={{
                        background: `radial-gradient(50% 80% at 50% 20%, transparent, #0A0B0F)`,
                      }}
                    />
                    <div className="absolute w-full h-[200%] z-50 inset-0 bg-[#0A0B0F] top-[100%]" />
                    <InteractiveShimmerCard
                      outerClassName={[
                        'z-30 rounded-md lg:rounded-xl w-[80vw] max-w-xl lg:max-w-3xl 2xl:max-w-4xl mx-auto mt-20 lg:mt-28',
                        styles['hero-video'],
                      ].join(' ')}
                      innerClassName=""
                    >
                      <div className="absolute w-full h-full z-50 inset-[1px] bg-[#0A0B0F80]" />
                      <video
                        className="relative z-0"
                        height="100%"
                        width="100%"
                        loop
                        muted
                        autoPlay
                      >
                        <source src="/images/index/dashboard-hero.mp4" type="video/mp4" />
                      </video>
                    </InteractiveShimmerCard>
                    <Particles />
                    {/* <div className="absolute w-full h-full z-50 pointer-events-none inset-0 bg-gradient-to-t from-[#0A0B0F] via-transparent to-transparent" /> */}
                    {/* <SBLogoVisual className="mx-auto absolute z-10 w-[50vw] max-w-[531px] h-full lg:h-[500px] max-h-[500px] bottom-[-50px] left-0 right-0" /> */}
                    {/* <img
                      src="/images/index/synth-grid.svg"
                      className="absolute mx-auto top-0 left-0 right-0 z-0 w-screen max-w-[800px] aspect-square opacity-10"
                    /> */}
                  </div>
                  <div className="relative z-30">
                    <h1 className="text-scale-1200 text-4xl sm:text-5xl sm:leading-none lg:text-7xl">
                      <span className="block text-[#F4FFFA00] bg-clip-text bg-gradient-to-b from-scale-1200 to-scale-1200 dark:to-scale-1100">
                        Build in a weekend
                      </span>
                      <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#3ECF8E] via-[#3ECF8E] to-[#3ecfb2] block md:ml-0">
                        Scale to millions
                      </span>
                    </h1>
                    <p className="pt-2 text-scale-1200 my-3 text-sm sm:mt-5 lg:mb-0 sm:text-base lg:text-lg">
                      Supabase is an open source Firebase alternative for building secure and
                      performant Postgres backends with minimal configuration.
                    </p>
                  </div>
                  <div className="relative z-30 flex items-center gap-2">
                    <Link href="https://app.supabase.com" as="https://app.supabase.com" passHref>
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
                  <HeroFrameworks className="relative z-30 mt-4 lg:mt-6" />
                </div>
              </div>
            </div>
          </div>
        </SectionContainer>
        {/* <div className="absolute pointer-events-none z-0 w-2/3 lg:w-full max-w-5xl h-[150px] lg:h-[300px] top-0 left-0 right-0 mx-auto ![perspective:1200px] sm:![perspective:1200px] md:![perspective:1200px] lg:![perspective:1200px]">
        <div
          className="absolute inset-0 w-full h-full top-0 mx-auto left-0 right-0 bg-gradient-to-r from-[#03C9B1] to-[#7D0CED] blur-[150px] lg:blur-[300px]"
          style={{
            transform: 'rotateX(-45deg)',
          }}
        />
      </div> */}
        <div className="relative z-30 w-1/2 container mx-auto h-px bg-gradient-to-r from-transparent via-scale-600 to-transparent" />
      </div>
      <img
        src="/images/index/gradient-bg.png"
        className="absolute mx-auto top-0 left-0 right-0 z-0 w-screen aspect-[2.5/1] pointer-events-none opacity-100"
      />
    </>
  )
}

export default Hero

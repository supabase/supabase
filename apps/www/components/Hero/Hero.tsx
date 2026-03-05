import SectionContainer from '~/components/Layouts/SectionContainer'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import Link from 'next/link'
import { SupaMock } from 'supa-mock'
import { Button } from 'ui'

const Hero = () => {
  const sendTelemetryEvent = useSendTelemetryEvent()

  return (
    <div className="relative -mt-[65px]">
      <SectionContainer className="pt-8 pb-10 md:pt-16 overflow-hidden">
        <div className="relative">
          <div className="mx-auto flex flex-col gap-16">
            <div className="mx-auto max-w-2xl lg:col-span-6 lg:flex lg:items-center justify-center text-center">
              <div className="relative z-10 lg:h-auto pt-[90px] lg:pt-[90px] lg:min-h-[300px] flex flex-col items-center justify-center sm:mx-auto md:w-3/4 lg:mx-0 lg:w-full gap-4 lg:gap-8">
                <div className="flex flex-col items-center">
                  <h1 className="text-foreground text-4xl sm:text-5xl sm:leading-none lg:text-7xl">
                    <span className="block text-foreground">Build in a weekend</span>
                    <span className="text-brand block md:ml-0">Scale to millions</span>
                  </h1>
                  <p className="pt-2 text-foreground my-3 text-sm sm:mt-5 lg:mb-0 sm:text-base lg:text-lg">
                    Start your project with a Postgres database, Authentication, instant APIs, Edge
                    Functions, Realtime subscriptions, Storage, and Vector embeddings.
                  </p>
                </div>
              </div>
            </div>
            <SupaMock
              defaultScreen="/dashboard/project"
              floatingScreens={[
                {
                  type: 'cli',
                  title: 'supabase — zsh',
                  initialPosition: { x: 44, y: 44 },
                  width: 460,
                  height: 500,
                },
              ]}
            />
          </div>
        </div>
      </SectionContainer>
    </div>
  )
}

export default Hero

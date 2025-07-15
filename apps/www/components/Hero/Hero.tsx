import Link from 'next/link'

import { Button } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import AnnouncementBadge from '../Announcement/Badge'
import { announcement } from 'ui-patterns'

const Hero = () => {
  const sendTelemetryEvent = useSendTelemetryEvent()

  return (
    <div className="relative -mt-[65px]">
      <SectionContainer className="pt-8 pb-10 md:pt-16 overflow-hidden">
        <div className="relative">
          <div className="mx-auto">
            <div className="mx-auto max-w-2xl lg:col-span-6 lg:flex lg:items-center justify-center text-center">
              <div className="relative z-10 lg:h-auto pt-[90px] lg:pt-[90px] lg:min-h-[300px] flex flex-col items-center justify-center sm:mx-auto md:w-3/4 lg:mx-0 lg:w-full gap-4 lg:gap-8">
                <AnnouncementBadge
                  url="/launch-week#main-stage"
                  badge="LW15"
                  announcement={`Day 2: ${announcement.launch}`}
                  className="lg:-mt-8"
                  hasArrow
                />
                <div className="flex flex-col items-center">
                  <h1 className="text-foreground text-4xl sm:text-5xl sm:leading-none lg:text-7xl">
                    <span className="block text-foreground">Build in a weekend</span>
                    <span className="text-brand block md:ml-0">Scale to millions</span>
                  </h1>
                  <p className="pt-2 text-foreground my-3 text-sm sm:mt-5 lg:mb-0 sm:text-base lg:text-lg">
                    Supabase is the Postgres development platform.{' '}
                    <br className="hidden md:block" />
                    Start your project with a Postgres database, Authentication, instant APIs, Edge
                    Functions, Realtime subscriptions, Storage, and Vector embeddings.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild size="medium">
                    <Link
                      href="https://supabase.com/dashboard"
                      as="https://supabase.com/dashboard"
                      onClick={() =>
                        sendTelemetryEvent({
                          action: 'start_project_button_clicked',
                          properties: { buttonLocation: 'Homepage Hero' },
                        })
                      }
                    >
                      Start your project
                    </Link>
                  </Button>
                  <Button asChild size="medium" type="default">
                    <Link
                      href="/contact/sales"
                      as="/contact/sales"
                      onClick={() =>
                        sendTelemetryEvent({
                          action: 'request_demo_button_clicked',
                          properties: { buttonLocation: 'Homepage Hero' },
                        })
                      }
                    >
                      Request a demo
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionContainer>
    </div>
  )
}

export default Hero

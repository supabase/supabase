'use client'

import { useSendTelemetryEvent } from '~/lib/telemetry'
import Link from 'next/link'
import { Button } from 'ui'

export function Hero() {
  const sendTelemetryEvent = useSendTelemetryEvent()

  return (
    <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6 pt-32 pb-16 md:pt-40 md:pb-32">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-end">
        <div className="flex flex-col gap-6 lg:gap-8">
          <h1 className="text-foreground text-4xl sm:text-5xl sm:leading-none">
            <span className="block">Build in a weekend</span>
            <span className="text-brand block">Scale to millions</span>
          </h1>
          <div className="flex items-center gap-2">
            <Button asChild size="medium">
              <Link
                href="https://supabase.com/dashboard"
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
        <p className="text-foreground-lighter text-sm lg:text-base">
          Start your project with a Postgres database.
          <br />
          Add Authentication, Data APIs, Edge Functions, Realtime Data, Storage, and Vector
          embeddings.
        </p>
      </div>
    </div>
  )
}

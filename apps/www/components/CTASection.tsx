'use client'

import { useSendTelemetryEvent } from '~/lib/telemetry'
import Link from 'next/link'
import { Button } from 'ui'

export function CTASection() {
  const sendTelemetryEvent = useSendTelemetryEvent()

  return (
    <div className="relative overflow-hidden py-32">
      <div className="relative z-20 flex flex-col items-center text-center gap-6">
        <h2 className="h2">
          <span className="text-foreground-lighter">Build in a weekend,</span>
          <span className="text-foreground block sm:inline"> scale to millions</span>
        </h2>
        <div className="flex items-center gap-2">
          <Button asChild size="medium">
            <Link
              href="https://supabase.com/dashboard"
              onClick={() =>
                sendTelemetryEvent({
                  action: 'start_project_button_clicked',
                  properties: { buttonLocation: 'CTA Banner' },
                })
              }
            >
              Start your project
            </Link>
          </Button>
          <Button asChild size="medium" variant="default">
            <Link
              href="/contact/sales"
              onClick={() =>
                sendTelemetryEvent({
                  action: 'request_demo_button_clicked',
                  properties: { buttonLocation: 'CTA Banner' },
                })
              }
            >
              Request a demo
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

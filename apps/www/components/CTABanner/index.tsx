'use client'

import Link from 'next/link'
import { Button, cn } from 'ui'
import { useSendTelemetryEvent } from '~/lib/telemetry'

interface Props {
  className?: string
  darkerBg?: boolean
}

const CTABanner = ({ darkerBg, className }: Props) => {
  const sendTelemetryEvent = useSendTelemetryEvent()
  return (
    <div
      className={cn(
        `bg-background grid grid-cols-12 items-center gap-4 border-t py-32 text-center px-16`,
        darkerBg && 'bg-alternative',
        className
      )}
    >
      <div className="col-span-12">
        <h2 className="h2">
          <span className="text-foreground-lighter">Build in a weekend,</span>
          <span className="text-foreground block sm:inline"> scale to millions</span>
        </h2>
      </div>
      <div className="flex items-center justify-center gap-2 col-span-12 mt-4">
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
        <Button asChild size="medium" type="default">
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
  )
}

export default CTABanner

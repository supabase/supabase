'use client'

import { useSendTelemetryEvent } from '~/lib/telemetry'
import { useIsLoggedIn } from 'common'
import Link from 'next/link'
import type { ComponentProps } from 'react'
import { Button } from 'ui'

import { getDashboardCtaHref } from '@/lib/dashboard-links'

type StartYourProjectButtonProps = {
  children?: React.ReactNode
  onClick?: ComponentProps<typeof Link>['onClick']
  buttonLocation?: string
  size?: ComponentProps<typeof Button>['size']
  variant?: ComponentProps<typeof Button>['variant']
  className?: string
}

export function StartYourProjectButton({
  children = 'Start your project',
  onClick,
  buttonLocation = 'no location set',
  size = 'medium',
  variant,
  className,
}: StartYourProjectButtonProps) {
  const isLoggedIn = useIsLoggedIn()
  const sendTelemetryEvent = useSendTelemetryEvent()

  return (
    <Button asChild size={size} variant={variant} className={className}>
      <a
        href={getDashboardCtaHref(isLoggedIn)}
        onClick={(event) => {
          onClick?.(event)
          sendTelemetryEvent({
            action: 'start_project_button_clicked',
            properties: { buttonLocation },
          })
        }}
      >
        {children}
      </a>
    </Button>
  )
}

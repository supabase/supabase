'use client'

import { useIsLoggedIn } from 'common'
import Link from 'next/link'
import type { ComponentProps } from 'react'
import { Button } from 'ui'

import { getDashboardCtaHref } from '@/lib/dashboard-links'

type StartYourProjectButtonProps = {
  children?: React.ReactNode
  onClick?: ComponentProps<typeof Link>['onClick']
  size?: ComponentProps<typeof Button>['size']
  variant?: ComponentProps<typeof Button>['variant']
  className?: string
}

export function StartYourProjectButton({
  children = 'Start your project',
  onClick,
  size = 'medium',
  variant,
  className,
}: StartYourProjectButtonProps) {
  const isLoggedIn = useIsLoggedIn()

  return (
    <Button asChild size={size} variant={variant} className={className}>
      <Link href={getDashboardCtaHref(isLoggedIn)} onClick={onClick}>
        {children}
      </Link>
    </Button>
  )
}

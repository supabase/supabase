import Link from 'next/link'
import { type PropsWithChildren, type ReactNode } from 'react'
import SVG from 'react-inlinesvg'
import { Card, CardContent, CardFooter, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { BASE_PATH } from '@/lib/constants'

type StandaloneFormPanelHeadingProps = {
  children: ReactNode
  className?: string
}

export function StandaloneFormPanelHeading({
  children,
  className,
}: StandaloneFormPanelHeadingProps) {
  return <h2 className={cn('text-xl m-0', className)}>{children}</h2>
}

type StandaloneFormCardProps = PropsWithChildren<{
  className?: string
}>

export function StandaloneFormCard({ children, className }: StandaloneFormCardProps) {
  return <Card className={cn('min-w-full w-full', className)}>{children}</Card>
}

type StandaloneFormCardContentProps = PropsWithChildren<{
  className?: string
}>

export function StandaloneFormCardContent({ children, className }: StandaloneFormCardContentProps) {
  return <CardContent className={cn('border-none py-8 px-0', className)}>{children}</CardContent>
}

type StandaloneFormCardFooterProps = PropsWithChildren<{
  className?: string
}>

export function StandaloneFormCardFooter({ children, className }: StandaloneFormCardFooterProps) {
  return (
    <CardFooter className={cn('flex-col items-stretch border-t px-6 py-4', className)}>
      {children}
    </CardFooter>
  )
}

type StandaloneFormPageHeaderProps = {
  title: string
  logoHref?: string
  logoTooltip?: string
}

export function StandaloneFormPageHeader({
  title,
  logoHref = '/sign-in',
  logoTooltip = 'Back to sign in',
}: StandaloneFormPageHeaderProps) {
  const logo = <SVG src={`${BASE_PATH}/img/supabase-logo.svg`} className="h-4 w-4" />

  return (
    <div className="flex items-center space-x-3">
      {logoHref ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={logoHref}
              className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground-muted"
            >
              {logo}
              <span className="sr-only">{logoTooltip}</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom">{logoTooltip}</TooltipContent>
        </Tooltip>
      ) : (
        logo
      )}
      <h1 className="m-0 text-lg">{title}</h1>
    </div>
  )
}

type StandaloneFormPageLayoutProps = PropsWithChildren<{
  title: string
  logoHref?: string
  logoTooltip?: string
}>

export function StandaloneFormPageLayout({
  title,
  children,
  logoHref,
  logoTooltip,
}: StandaloneFormPageLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-y-auto overflow-x-hidden bg-studio">
      <div className="mx-auto my-16 max-w-2xl w-full px-4 lg:px-6">
        <div className="flex flex-col gap-y-8">
          <StandaloneFormPageHeader title={title} logoHref={logoHref} logoTooltip={logoTooltip} />
          {children}
        </div>
      </div>
    </div>
  )
}

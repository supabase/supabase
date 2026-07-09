import { motion } from 'framer-motion'
import { ArrowRightLeft } from 'lucide-react'
import type { PropsWithChildren, ReactNode } from 'react'
import { Card, CardContent, CardHeader, cn } from 'ui'

import { ProfileImage } from '@/components/ui/ProfileImage'
import { BASE_PATH } from '@/lib/constants'

const MotionCard = motion.create(Card)

interface InterstitialLayoutProps {
  logo?: ReactNode
  title?: ReactNode
  description?: ReactNode
  /** Optional content rendered beneath the card (e.g. a terms disclaimer), at the card's width. */
  footer?: ReactNode
  containerClassName?: string
  cardClassName?: string
  titleClassName?: string
  descriptionClassName?: string
}

/**
 * Minimal full-screen centered layout for interstitial flows:
 * partner authorization, org invites, CLI auth, credit redemption, etc.
 *
 * The logo, title, and description render inside the card (above children),
 * so every consumer gets a consistent header for free.
 */
export const InterstitialLayout = ({
  logo,
  title,
  description,
  footer,
  containerClassName,
  cardClassName,
  titleClassName,
  descriptionClassName,
  children,
}: PropsWithChildren<InterstitialLayoutProps>) => {
  const TitleElement = typeof title === 'string' ? 'h1' : 'div'
  const DescriptionElement = typeof description === 'string' ? 'p' : 'div'

  const titleElement = title ? (
    <TitleElement
      className={cn(
        'font-sans tracking-tight text-balance text-lg font-medium normal-case text-foreground',
        titleClassName
      )}
    >
      {title}
    </TitleElement>
  ) : null

  const descriptionElement = description ? (
    <DescriptionElement
      className={cn(
        '!m-0 px-3 !text-balance text-sm text-foreground-lighter leading-tight',
        descriptionClassName
      )}
    >
      {description}
    </DescriptionElement>
  ) : null

  const card = (
    <MotionCard
      layout="size"
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn('overflow-hidden max-w-[400px] w-full mx-auto', cardClassName)}
    >
      {(logo || title || description) && (
        <CardHeader className="font-normal items-center gap-0 space-y-0 px-6 py-6 text-center [--card-padding-x:1.5rem] border-0">
          {logo && <div className="mb-4 flex justify-center">{logo}</div>}
          {(titleElement || descriptionElement) && (
            <div className="flex flex-col items-center gap-1">
              {titleElement}
              {descriptionElement}
            </div>
          )}
        </CardHeader>
      )}
      {children}
    </MotionCard>
  )

  return (
    <div
      className={cn(
        'flex min-h-screen w-full items-center justify-center bg-studio px-2 py-6',
        containerClassName
      )}
    >
      {footer ? (
        <div className="flex w-full max-w-[400px] flex-col items-center gap-4">
          {card}
          <div className="px-2 text-center text-balance">{footer}</div>
        </div>
      ) : (
        card
      )}
    </div>
  )
}

/**
 * Standard rounded-rect logo container (48x48).
 * Partner logos fill edge-to-edge (see `PartnerLogo`); the Supabase symbol and
 * Lucide icons sit inset (sized at `size-7`).
 */
export const LogoBox = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div
    className={cn(
      'flex size-12 items-center justify-center overflow-hidden rounded-xl border bg-muted',
      className
    )}
  >
    {children}
  </div>
)

/** Two pre-boxed logos side-by-side with a swap separator. */
export const LogoPair = ({ left, right }: { left: ReactNode; right: ReactNode }) => (
  <div className="flex items-center justify-center gap-2.5">
    {left}
    <ArrowRightLeft className="size-4 text-foreground-muted" />
    {right}
  </div>
)

/** Partner logo rendered edge-to-edge inside a LogoBox by default. */
export const PartnerLogo = ({
  src,
  alt,
  className,
  imageClassName,
}: {
  src: string
  alt: string
  className?: string
  imageClassName?: string
}) => (
  <LogoBox className={className}>
    <img alt={alt} src={src} className={cn('size-full object-cover', imageClassName)} />
  </LogoBox>
)

/**
 * Sign-in destination mark, inset to match {@link SupabaseLogo}. Falls back to the destination's
 * initial when no icon is available.
 */
export const DestinationLogo = ({ icon, name }: { icon?: ReactNode; name: string }) => (
  <LogoBox>
    {icon ?? <span className="text-lg font-medium text-foreground-light">{name.slice(0, 1)}</span>}
  </LogoBox>
)

/** Supabase symbol (not the wordmark) rendered inset inside a LogoBox. */
export const SupabaseLogo = () => (
  <LogoBox className="bg-surface-75">
    <img alt="Supabase" src={`${BASE_PATH}/img/supabase-logo.svg`} className="size-7" />
  </LogoBox>
)

export const InterstitialAccountRow = ({
  avatarUrl,
  displayName,
  action,
  className,
}: {
  avatarUrl?: string
  displayName?: string
  action?: ReactNode
  className?: string
}) => (
  <Card className={cn('shadow-none', !action && 'border-muted bg-surface-200/50', className)}>
    <CardContent
      className={cn(
        'flex gap-3 border-none',
        action ? 'items-center px-4 py-3' : 'items-start p-3'
      )}
    >
      <ProfileImage
        src={avatarUrl}
        alt={displayName}
        className="size-8 flex-shrink-0 rounded-full border border-muted"
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-foreground-light">Signed in as</p>
        <p className="truncate text-sm text-foreground">
          {displayName || <span className="invisible">Loading account</span>}
        </p>
      </div>
      {action}
    </CardContent>
  </Card>
)

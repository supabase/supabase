import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRightLeft } from 'lucide-react'
import type { PropsWithChildren, ReactNode } from 'react'
import { Card, CardContent, CardHeader, cn } from 'ui'

import { ProfileImage } from '@/components/ui/ProfileImage'
import { BASE_PATH } from '@/lib/constants'

const MotionCard = motion.create(Card)

const EXPANDABLE_CONTENT_TRANSITION = { duration: 0.22, ease: [0.16, 1, 0.3, 1] } as const

interface InterstitialLayoutProps {
  logo?: ReactNode
  title?: ReactNode
  description?: ReactNode
  subtitle?: ReactNode
  containerClassName?: string
  cardClassName?: string
  titleClassName?: string
  descriptionClassName?: string
  subtitleClassName?: string
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
  subtitle,
  containerClassName,
  cardClassName,
  titleClassName,
  descriptionClassName,
  subtitleClassName,
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

  return (
    <div
      className={cn(
        'flex min-h-screen w-full items-center justify-center bg-studio px-2 py-6',
        containerClassName
      )}
    >
      <MotionCard
        layout="size"
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={cn('overflow-hidden max-w-[400px] w-full mx-auto', cardClassName)}
      >
        {(logo || title || description || subtitle) && (
          <CardHeader className="font-normal items-center gap-0 space-y-0 px-6 py-6 text-center [--card-padding-x:1.5rem] border-0">
            {logo && <div className="mb-4 flex justify-center">{logo}</div>}
            {(titleElement || descriptionElement) && (
              <div className="flex flex-col items-center gap-1">
                {titleElement}
                {descriptionElement}
              </div>
            )}
            {subtitle && (
              <div className={cn('mt-2.5 text-sm text-foreground-lighter', subtitleClassName)}>
                {subtitle}
              </div>
            )}
          </CardHeader>
        )}
        {children}
      </MotionCard>
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

/** Partner logo rendered edge-to-edge inside a LogoBox. */
export const PartnerLogo = ({ src, alt }: { src: string; alt: string }) => (
  <LogoBox>
    <img alt={alt} src={src} className="size-full object-cover" />
  </LogoBox>
)

/** Supabase symbol (not the wordmark) rendered inset inside a LogoBox. */
export const SupabaseLogo = () => (
  <LogoBox>
    <img alt="Supabase" src={`${BASE_PATH}/img/supabase-logo.svg`} className="size-7" />
  </LogoBox>
)

export const InterstitialMetadataPill = ({ children }: PropsWithChildren) => (
  <span className="mx-auto mt-1.5 flex w-fit items-center gap-1 rounded-full border border-muted px-2 py-1 font-mono text-[11px] tracking-tight text-foreground-lighter">
    {children}
  </span>
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

export const InterstitialExpandableContent = ({
  show,
  children,
}: PropsWithChildren<{ show: boolean }>) => (
  <AnimatePresence initial={false}>
    {show && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={EXPANDABLE_CONTENT_TRANSITION}
        className="overflow-hidden"
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
)

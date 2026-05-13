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
  containerClassName?: string
  cardClassName?: string
  titleClassName?: string
  descriptionClassName?: string
}

export const InterstitialLayout = ({
  logo,
  title,
  description,
  containerClassName,
  cardClassName,
  titleClassName,
  descriptionClassName,
  children,
}: PropsWithChildren<InterstitialLayoutProps>) => {
  const TitleElement = typeof title === 'string' ? 'h1' : 'div'
  const DescriptionElement = typeof description === 'string' ? 'p' : 'div'

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
        className={cn('mx-auto w-full max-w-[400px] overflow-hidden', cardClassName)}
      >
        {(logo || title || description) && (
          <CardHeader className="items-center gap-0 space-y-0 border-0 px-6 py-6 text-center font-normal [--card-padding-x:1.5rem]">
            {logo && <div className="mb-4 flex justify-center">{logo}</div>}
            {(title || description) && (
              <div className="flex flex-col items-center gap-1">
                {title && (
                  <TitleElement
                    className={cn(
                      'font-sans text-lg font-medium tracking-tight text-balance text-foreground',
                      titleClassName
                    )}
                  >
                    {title}
                  </TitleElement>
                )}
                {description && (
                  <DescriptionElement
                    className={cn(
                      '!m-0 px-3 text-sm leading-tight !text-balance text-foreground-lighter',
                      descriptionClassName
                    )}
                  >
                    {description}
                  </DescriptionElement>
                )}
              </div>
            )}
          </CardHeader>
        )}
        {children}
      </MotionCard>
    </div>
  )
}

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

export const LogoPair = ({ left, right }: { left: ReactNode; right: ReactNode }) => (
  <div className="flex items-center justify-center gap-2.5">
    {left}
    <ArrowRightLeft className="size-4 text-foreground-muted" />
    {right}
  </div>
)

export const SupabaseLogo = () => (
  <LogoBox>
    <img alt="Supabase" src={`${BASE_PATH}/img/supabase-logo.svg`} className="size-7" />
  </LogoBox>
)

export const InterstitialAccountRow = ({
  avatarUrl,
  displayName,
}: {
  avatarUrl?: string
  displayName?: string
}) => (
  <Card className="border-muted bg-surface-200/50 shadow-none">
    <CardContent className="flex items-start gap-3 border-none p-3">
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
    </CardContent>
  </Card>
)

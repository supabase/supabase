import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'

import { useOrganizationRestrictions } from 'hooks/misc/useOrganizationRestrictions'
import { XIcon } from 'lucide-react'
import { Button, cn, CriticalIcon, WarningIcon } from 'ui'

const bannerMotionProps = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.2, delay: 0.5 },
} as const

const linkStyles =
  '[&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-foreground-muted/80 [&_a]:hover:decoration-foreground [&_a]:hover:text-foreground [&_a]:transition-all'

export const OrganizationResourceBanner = () => {
  const { warnings } = useOrganizationRestrictions()

  return (
    <AnimatePresence initial={false}>
      {warnings.map((warning) => (
        <HeaderBanner key={`${warning.variant}-${warning.title}`} {...warning} />
      ))}
    </AnimatePresence>
  )
}

interface HeaderBannerProps {
  variant: 'danger' | 'warning' | 'note'
  title: string
  description: string | ReactNode
  onDismiss?: () => void
}
const variantStyles = {
  danger: {
    banner: 'bg-destructive-200 border-destructive-400',
    icon: 'text-destructive-200 bg-destructive-600',
  },
  warning: {
    banner: 'bg-warning-200 border-warning-400',
    icon: 'text-warning-200 bg-warning-600',
  },
  note: {
    banner: 'bg-surface-200/25 border-default',
    icon: 'text-background bg-foreground',
  },
} as const

export const HeaderBanner = ({ variant, title, description, onDismiss }: HeaderBannerProps) => {
  const { banner: bannerStyles, icon: iconStyles } = variantStyles[variant]
  const Icon = variant === 'danger' ? CriticalIcon : WarningIcon

  return (
    <motion.div
      {...bannerMotionProps}
      className={cn('relative border-b overflow-hidden', bannerStyles)}
      layout="position"
    >
      {/* Wrapped content for smooth reveal animation */}
      <div className="px-4 py-4 md:py-3 flex items-center md:justify-center">
        {/* Striped background */}
        <div
          className="absolute inset-0 opacity-[1.6%] dark:opacity-[0.8%]"
          style={{
            background: `repeating-linear-gradient(
              45deg,
              currentColor,
              currentColor 10px,
              transparent 10px,
              transparent 20px
            )`,
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 90%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 90%)',
          }}
        />
        {/* Icon and text content */}
        <div
          className={cn(
            'relative items-start md:items-center flex flex-row gap-3 min-w-0',
            // Avoid collision with the dismiss button
            onDismiss && 'pr-7 md:px-7'
          )}
        >
          <Icon className={cn('flex-shrink-0 w-5 h-5 md:w-4 md:h-4', iconStyles)} />
          {/* Title and description */}
          <div
            className={cn(
              'flex flex-col md:flex-row gap-0.5 md:gap-1.5 text-balance md:flex-nowrap min-w-0 flex-1'
            )}
          >
            {/* Title */}
            <p className="text-sm text-foreground font-medium md:truncate">{title}</p>
            {/* Description */}
            <div className="flex flex-row items-center gap-1.5 min-w-0 md:flex-nowrap text-sm">
              <span className="hidden md:inline text-foreground-muted">·</span>
              {typeof description === 'string' ? (
                <p className="text-foreground-light md:truncate">{description}</p>
              ) : (
                <div className={cn('text-foreground-light md:truncate', linkStyles)}>
                  {description}
                </div>
              )}
            </div>
          </div>
        </div>

        {onDismiss && (
          <Button
            type="text"
            size="tiny"
            className="opacity-75 z-[1] flex-shrink-0 p-0.5 h-auto absolute right-5 md:right-4 top-1/2 -translate-y-1/2"
            onClick={onDismiss}
            aria-label="Dismiss banner"
          >
            <XIcon size={16} className="text-foreground" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}

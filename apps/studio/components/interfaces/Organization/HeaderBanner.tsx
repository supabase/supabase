import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'

import { useOrganizationRestrictions } from 'hooks/misc/useOrganizationRestrictions'
import { cn, CriticalIcon, WarningIcon } from 'ui'

const bannerMotionProps = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.2, delay: 0.5 },
} as const

const linkStyles =
  '[&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-foreground-muted/80 [&_a]:hover:decoration-foreground [&_a]:transition-all'

export const OrganizationResourceBanner = () => {
  const { warnings } = useOrganizationRestrictions()

  return (
    <AnimatePresence initial={false}>
      {warnings.map((warning, i) => (
        <HeaderBanner key={i} {...warning} />
      ))}
    </AnimatePresence>
  )
}

export const HeaderBanner = ({
  variant,
  title,
  description,
}: {
  variant: 'danger' | 'warning' | 'note'
  title: string
  description: string | ReactNode
}) => {
  const bannerStyles =
    variant === 'danger'
      ? 'bg-destructive-200 border-destructive-400'
      : variant === 'warning'
        ? 'bg-warning-200 border-warning-400'
        : 'bg-surface-200/25 border-default'
  const Icon = variant === 'danger' ? CriticalIcon : WarningIcon
  const iconStyles =
    variant === 'danger'
      ? 'text-destructive-200 bg-destructive-600'
      : variant === 'warning'
        ? 'text-warning-200 bg-warning-600'
        : 'text-background bg-foreground'

  return (
    <motion.div
      {...bannerMotionProps}
      className={cn(
        'relative border-b px-4 py-4 md:py-3 flex items-center md:justify-center',
        bannerStyles
      )}
      layout="position"
    >
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
      {/* Text content and link */}
      <div className="relative items-start md:items-center flex flex-row gap-3 min-w-0">
        <Icon className={cn('flex-shrink-0 w-5 h-5 md:w-4 md:h-4', iconStyles)} />
        {/* Text content */}
        <div className="flex flex-col md:flex-row gap-0.5 md:gap-2.5 text-balance md:flex-nowrap min-w-0 flex-1">
          {/* Title */}
          <p className="text-sm text-foreground font-medium md:truncate">{title}</p>
          {/* Description */}
          <div className="flex flex-row items-center gap-2 min-w-0 md:flex-nowrap">
            {typeof description === 'string' ? (
              <p className="text-sm text-foreground-light md:truncate">{description}</p>
            ) : (
              <div className={cn('text-sm text-foreground-light md:truncate', linkStyles)}>
                {description}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

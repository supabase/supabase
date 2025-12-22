import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'

import { useOrganizationRestrictions } from 'hooks/misc/useOrganizationRestrictions'
import { cn, CriticalIcon, WarningIcon } from 'ui'

const bannerMotionProps = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.2, delay: 0.5 },
} as const

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
  type,
  title,
  message,
  link,
  linkText = 'Details',
}: {
  type: 'danger' | 'warning' | 'note'
  title: string
  message: string
  link?: string
  linkText?: string
}) => {
  const bannerStyles =
    type === 'danger'
      ? 'bg-destructive-200 border-destructive-400'
      : type === 'warning'
        ? 'bg-warning-200 border-warning-400'
        : 'bg-surface-200/25 border-default'
  const Icon = type === 'danger' ? CriticalIcon : WarningIcon
  const iconStyles =
    type === 'danger'
      ? 'text-destructive-200 bg-destructive-600'
      : type === 'warning'
        ? 'text-warning-200 bg-warning-600'
        : 'text-background bg-foreground'

  return (
    <motion.div
      {...bannerMotionProps}
      className={cn(
        'relative border-b py-3 flex items-center justify-center flex-shrink-0 px-0',
        bannerStyles
      )}
      layout="position"
    >
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
      <div className="relative z-[1] items-center flex flex-row gap-2">
        <Icon className={cn('flex-shrink-0', iconStyles)} />
        {/* Required text */}
        <div className="flex flex-col md:flex-row gap-0 md:gap-2.5">
          <p className="text-sm text-foreground font-medium">{title}</p>
          <p className="text-sm text-foreground-light">{message}</p>
        </div>
        {/* Optional link */}
        {link && (
          <div className="hidden lg:flex text-sm flex-row items-center gap-2">
            <span className="text-foreground-muted">·</span>
            <p className="text-foreground-light underline underline-offset-2 decoration-foreground-muted/80 hover:decoration-foreground transition-all">
              <Link href={link}>{linkText}</Link>
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

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
}: {
  type: 'danger' | 'warning' | 'note' | 'incident'
  title: string
  message: string
  link?: string
}) => {
  const bannerStyles =
    type === 'danger'
      ? 'bg-destructive-300 dark:bg-destructive-200'
      : type === 'incident'
        ? 'bg-brand-400'
        : 'bg-warning-300 dark:bg-warning-200'
  const Icon = type === 'danger' ? CriticalIcon : WarningIcon

  return (
    <motion.div
      {...bannerMotionProps}
      className={cn(
        `relative ${bannerStyles} border-b border-muted py-1 flex items-center justify-center flex-shrink-0 px-0`,
        type === 'incident' && 'hover:bg-brand-300',
        'flex-shrink-0'
      )}
    >
      <div className={cn('items-center flex flex-row gap-3')}>
        <div className="absolute inset-y-0 left-0 right-0 overflow-hidden z-0">
          <div
            className="absolute inset-0 opacity-[0.8%]"
            style={{
              background: `repeating-linear-gradient(
                    45deg,
                    currentColor,
                    currentColor 10px,
                    transparent 10px,
                    transparent 20px
                  )`,
              maskImage: 'linear-gradient(to top, black, transparent)',
              WebkitMaskImage: 'linear-gradient(to top, black, transparent)',
            }}
          />
        </div>
        <Icon
          className={cn('z-[1] flex-shrink-0', type === 'incident' && 'bg-brand text-brand-200')}
        />
        <div className="flex flex-col md:flex-row gap-0 md:gap-3">
          <span
            className={cn(
              'text-xs sm:text-sm z-[1]',
              type === 'danger'
                ? 'text-destructive'
                : type === 'incident'
                  ? 'text-foreground'
                  : 'text-warning'
            )}
          >
            {title}
          </span>
          <span
            className={cn(
              'text-xs sm:text-sm z-[1] opacity-75',
              type === 'danger'
                ? 'text-destructive'
                : type === 'incident'
                  ? 'text-foreground'
                  : 'text-warning'
            )}
          >
            {message}
          </span>
        </div>
        {link && (
          <button
            className={cn(
              'lg:block hidden',
              'text-foreground-lighter text-sm z-[1] m-0',
              type === 'danger' ? 'text-destructive' : 'text-warning'
            )}
          >
            <Link href={link}>View Details</Link>
          </button>
        )}
      </div>
    </motion.div>
  )
}

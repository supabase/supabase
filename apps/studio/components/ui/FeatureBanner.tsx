import { X } from 'lucide-react'
import { ReactNode } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

import { useParams } from 'common/hooks'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { Button, cn } from 'ui'

// Base props common to all feature banners
interface BaseFeatureBannerProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  className?: string
  dismissClassName?: string
  defaultDismissed?: boolean
  illustration?: ReactNode
  bgAlt?: boolean
}

// Type for non-dismissable banners (no storageKey needed)
interface NonDismissableFeatureBannerProps extends BaseFeatureBannerProps {
  dismissable?: false
  storageKey?: never
}

// Type for dismissable banners (requires storageKey)
interface DismissableFeatureBannerProps extends BaseFeatureBannerProps {
  dismissable: true
  storageKey: string | ((ref: string) => string)
}

// Union type that enforces the constraint
export type FeatureBannerProps = NonDismissableFeatureBannerProps | DismissableFeatureBannerProps

export const FeatureBanner = ({
  storageKey,
  children,
  className,
  dismissClassName,
  defaultDismissed = false,
  illustration,
  dismissable = false,
  bgAlt = false,
  ...props
}: FeatureBannerProps) => {
  const { ref } = useParams()
  const key = storageKey && typeof storageKey === 'function' ? storageKey(ref ?? '') : storageKey

  const [isDismissed, setIsDismissed] = useLocalStorageQuery(
    key || 'feature-banner-dismissed',
    defaultDismissed
  )

  if (dismissable && storageKey && isDismissed) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
        mass: 1,
      }}
      {...props}
      className={cn(
        'pb-36 pt-10 relative w-full border xl:py-10 px-10 rounded-md overflow-hidden',
        bgAlt && 'bg-background-alternative',
        className
      )}
    >
      {children}
      {illustration}
      {dismissable && storageKey && (
        <div className={cn('absolute top-3 right-3', dismissClassName)}>
          <Button
            type="text"
            size="tiny"
            icon={<X size={16} strokeWidth={1.5} />}
            onClick={() => setIsDismissed(true)}
            className="opacity-75 px-1"
            aria-label="Dismiss notification"
          />
        </div>
      )}
    </motion.div>
  )
}

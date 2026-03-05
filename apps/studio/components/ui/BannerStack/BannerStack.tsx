import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBannerStack } from './BannerStackProvider'
import { cn } from 'ui'

export const BannerStack = () => {
  const { banners } = useBannerStack()
  const [isHovered, setIsHovered] = useState(false)

  const activeBanners = banners.filter((b) => !b.isDismissed)

  const PEEK_HEIGHT = 4
  const CARD_GAP = 4
  const CARD_HEIGHT = 212

  if (activeBanners.length === 0) return null

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{
        y: isHovered ? -8 : 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }}
    >
      <div className="relative">
        <AnimatePresence mode="popLayout">
          {activeBanners.map((banner, index) => {
            const isBottomBanner = index === 0
            const reverseIndex = activeBanners.length - 1 - index
            const collapsedY = index * PEEK_HEIGHT
            const expandedY = index * (CARD_HEIGHT + CARD_GAP)

            return (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, scale: 0.99, y: 8 }}
                animate={{
                  opacity: 1,
                  scale: isHovered ? 1 : 1 - index * 0.07,
                  x: 0,
                  y: isHovered ? -expandedY : -collapsedY,
                }}
                exit={{ opacity: 0, scale: 0.99, y: 8 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                  delay: 0.25,
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                  position: isBottomBanner ? 'relative' : 'absolute',
                  bottom: isBottomBanner ? undefined : 0,
                  right: isBottomBanner ? undefined : 0,
                  zIndex: 30 + reverseIndex,
                  transformOrigin: 'center bottom',
                }}
                className={cn(
                  'w-full max-w-72',
                  !isHovered && index === 0 && 'pointer-events-none'
                )}
              >
                {banner.content}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

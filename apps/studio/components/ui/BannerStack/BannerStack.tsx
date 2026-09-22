import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'

import { useBannerStack } from './BannerStackProvider'

const PEEK_OFFSET = 8
const MAX_PEEKS = 2

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const

export const BannerStack = () => {
  const { banners } = useBannerStack()
  const [isHovered, setIsHovered] = useState(false)
  const reduceMotion = useReducedMotion()

  const activeBanners = banners.filter((b) => !b.isDismissed)
  if (activeBanners.length === 0) return null

  const [frontBanner, ...extraBanners] = activeBanners
  const peekCount = Math.min(extraBanners.length, MAX_PEEKS)
  // Deepest sliver first so the closer ones paint on top of it.
  const peeks = Array.from({ length: peekCount }, (_, i) => peekCount - i)

  const transition = reduceMotion ? { duration: 0 } : SPRING

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-50 flex flex-col-reverse items-end gap-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{ y: isHovered ? -8 : 0 }}
      transition={transition}
    >
      <div className="relative w-full max-w-72">
        <AnimatePresence>
          {!isHovered &&
            peeks.map((depth) => (
              <motion.div
                key={`peek-${depth}`}
                className="absolute inset-0 rounded-2xl border bg-surface-75 shadow-lg"
                style={{ transformOrigin: 'center top' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: -depth * PEEK_OFFSET, scaleX: 1 - depth * 0.06 }}
                exit={{ opacity: 0, y: 0, scaleX: 1 }}
                transition={transition}
              />
            ))}
        </AnimatePresence>

        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, scale: 0.99, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.99, y: 8 }}
          transition={transition}
        >
          {frontBanner.content}
        </motion.div>
      </div>

      <AnimatePresence>
        {isHovered &&
          extraBanners.map((banner, index) => (
            <motion.div
              key={banner.id}
              className="w-full max-w-72"
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={reduceMotion ? { duration: 0 } : { ...SPRING, delay: index * 0.04 }}
            >
              {banner.content}
            </motion.div>
          ))}
      </AnimatePresence>
    </motion.div>
  )
}

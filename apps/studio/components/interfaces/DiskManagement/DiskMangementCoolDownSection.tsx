import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import React, { useEffect, useState } from 'react'

import { DialogSection } from 'ui'
import CountdownTimerRadial from '../../ui/CountdownTimer/CountdownTimerRadial'

export const DiskMangementCoolDownSection: React.FC = () => {
  const [progress, setProgress] = useState(100)
  const [showCountdown, setShowCountdown] = useState(false)
  const [isJumping, setIsJumping] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const startCountdown = () => {
      setShowCountdown(true)
      setProgress(100)
      const interval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress <= 0) {
            clearInterval(interval)
            setIsJumping(true)
            setTimeout(() => {
              setIsJumping(false)
              setProgress(100)
              startCountdown() // Restart the countdown
            }, 300) // Duration of the jump animation
            return 0
          }
          return prevProgress - 1
        })
      }, 100)

      return () => clearInterval(interval)
    }

    const initialDelay = setTimeout(startCountdown, 1000)

    return () => clearTimeout(initialDelay)
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.15 }}
        >
          <DialogSection className="bg-surface-100 text-sm text-foreground-light flex items-center gap-4 relative">
            <div className="w-12 h-12 opacity-75">
              <AnimatePresence>
                {showCountdown && (
                  <motion.div
                    key="countdown-timer"
                    initial={{ scale: 0.8, opacity: 0, y: -8 }}
                    animate={{
                      scale: isJumping ? 1.2 : 1,
                      opacity: 1,
                      y: isJumping ? -8 : 0,
                    }}
                    exit={{ scale: 0.8, opacity: 0, y: -8 }}
                    transition={{
                      duration: isJumping ? 0.3 : 0.8,
                      type: 'spring',
                      bounce: 0.6,
                    }}
                  >
                    <CountdownTimerRadial progress={progress} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex flex-col gap-0 flex-grow">
              <p className="text-sm text-foreground">
                For 6 hours you will not be able to make further changes.
              </p>
              <p className="text-sm text-foreground-light">
                Due to a cooldown period between disk changes.
              </p>
            </div>
            <button
              type="button"
              className="text-foreground-lighter hover:text-foreground-light transition-colors self-start p-1"
              onClick={() => setIsVisible(false)}
            >
              <X size={14} />
            </button>
          </DialogSection>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

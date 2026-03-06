import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

import CountdownTimerRadial from 'components/ui/CountdownTimer/CountdownTimerRadial'
import { DialogSection } from 'ui'

export const DiskMangementCoolDownSection = ({ visible }: { visible: boolean }) => {
  const [progress, setProgress] = useState(100)
  const [showCountdown, setShowCountdown] = useState(false)
  const [isJumping, setIsJumping] = useState(false)

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
      {visible && (
        <motion.div
          initial={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.15 }}
          className="w-full"
        >
          <DialogSection className="bg-surface-100 text-sm text-foreground-light flex items-center gap-4 relative w-full border rounded-md">
            <div className="w-12 h-12">
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
                For 4 hours you will not be able to change any disk attributes.
              </p>
              <p className="text-sm text-foreground-light">
                There is a cooldown period enforced for any disk attribute modifications
              </p>
            </div>
          </DialogSection>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

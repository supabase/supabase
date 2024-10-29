import { AnimatePresence, motion } from 'framer-motion'
import { COOLDOWN_DURATION } from 'data/config/disk-attributes-update-mutation'
import { Card, CardContent } from 'ui'
import CountdownTimerRadial from '../../../ui/CountdownTimer/CountdownTimerRadial'
import CountdownTimerSpan from '../../../ui/CountdownTimer/CountdownTimerSpan'
import { useRemainingDurationForDiskAttributeUpdate } from 'data/config/disk-attributes-query'
import { useParams } from 'common'
import FormMessage from './FormMessage'
import { useEffect, useState } from 'react'

export function DiskCountdownRadial() {
  const { ref } = useParams()
  const [remainingTime, setRemainingTime] = useState(0)

  const {
    remainingDuration: initialRemainingTime,
    isWithinCooldownWindow,
    error,
    isSuccess,
  } = useRemainingDurationForDiskAttributeUpdate({
    projectRef: ref,
  })

  const progressPercentage = (remainingTime / COOLDOWN_DURATION) * 100

  useEffect(() => {
    if (initialRemainingTime > 0) setRemainingTime(initialRemainingTime)
  }, [initialRemainingTime])

  useEffect(() => {
    if (remainingTime <= 0) return

    const timer = setInterval(() => {
      setRemainingTime(Math.max(0, remainingTime - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [remainingTime])

  console.log('isWithinCooldownWindow IN COMPONENT', isWithinCooldownWindow)

  return (
    <AnimatePresence>
      {remainingTime > 0 && isSuccess && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="px-2 rounded bg-surface-100">
            <CardContent className="py-3 flex gap-3 px-3 items-start">
              <CountdownTimerRadial progress={progressPercentage} />
              <div className="flex flex-col gap-2">
                <div>
                  <p className="text-foreground text-sm p-0">
                    6-hour cooldown period is in progress
                  </p>
                  <p className="text-foreground-lighter text-sm p-0">
                    You can't modify your disk configuration again until the 6-hour cool down period
                    ends.
                  </p>
                </div>
                <CountdownTimerSpan seconds={remainingTime} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
      {error && <FormMessage message={error.message} type="error" />}
    </AnimatePresence>
  )
}

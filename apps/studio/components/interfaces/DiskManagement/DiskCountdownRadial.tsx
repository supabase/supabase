import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

import { useParams } from 'common'
import { useRemainingDurationForDiskAttributeUpdate } from 'data/config/disk-attributes-query'
import { COOLDOWN_DURATION } from 'data/config/disk-attributes-update-mutation'
import { Card, CardContent } from 'ui'
import CountdownTimerRadial from './CountdownTimerRadial'
import CountdownTimerSpan from './CountdownTimerSpan'

export function DiskCountdownRadial() {
  const { ref: projectRef } = useParams()
  const [remainingTime, setRemainingTime] = useState(0)

  const { remainingDuration: initialRemainingTime } = useRemainingDurationForDiskAttributeUpdate({
    projectRef,
  })

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

  const progressPercentage = (remainingTime / COOLDOWN_DURATION) * 100

  return (
    <AnimatePresence>
      {remainingTime !== 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="px-2 rounded-none">
            <CardContent className="py-3 flex gap-3 px-3 items-center">
              <CountdownTimerRadial progress={progressPercentage} />
              <div className="flex flex-col">
                <p className="text-foreground-lighter text-sm p-0">
                  6-hour wait period between disk modifications.
                </p>
                <CountdownTimerSpan seconds={remainingTime} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

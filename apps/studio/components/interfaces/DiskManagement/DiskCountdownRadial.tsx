'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { Card, CardContent, ChartConfig } from 'ui'
import CountdownTimerRadial from './CountdownTimerRadial'
import CountdownTimerSpan from './CountdownTimerSpan'
import { useDiskManagement } from './useDiskManagement'

export function DiskCountdownRadial({}: any) {
  const { remainingTime, totalWaitTime: TOTAL_TIME, updateDiskConfiguration } = useDiskManagement()

  useEffect(() => {
    if (remainingTime <= 0) return

    const timer = setInterval(() => {
      updateDiskConfiguration({
        remainingTime: Math.max(0, remainingTime - 1),
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [remainingTime])

  const progressPercentage = (remainingTime / TOTAL_TIME) * 100

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

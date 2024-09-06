'use client'

import { AnimatePresence, motion } from 'framer-motion'
import MotionNumber from 'motion-number'
import { useState } from 'react'
import { badgeVariants, cn } from 'ui'

export default function DiskSpaceBar({
  showNewBar,
  totalSize,
  usedSize,
  newTotalSize,
}: {
  showNewBar: boolean
  totalSize: number
  usedSize: number
  newTotalSize: number
}) {
  //   const [totalSize, setTotalSize] = useState<number>(8) // 8 GB total disk size
  //   const [usedSize, setUsedSize] = useState<number>(4) // Starting with 4 GB used (50% usage)
  const [resizeThreshold, setResizeThreshold] = useState<number>(0.5) // 500 MB threshold for resize

  const freeSize = totalSize - usedSize
  const usedPercentage = (usedSize / totalSize) * 100
  const resizePoint = totalSize - resizeThreshold
  const resizePercentage = (resizePoint / totalSize) * 100

  const newUsedPercentage = (usedSize / newTotalSize) * 100
  const newResizePoint = newTotalSize - resizeThreshold
  const newResizePercentage = (newResizePoint / newTotalSize) * 100

  //   const showNewBar = newTotalSize !== totalSize && newTotalSize > totalSize

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center h-6 gap-3">
        <span className="text-foreground-light text-sm font-mono flex items-center gap-2">
          {usedSize.toFixed(2)} GB used of{' '}
          <span className="text-foreground font-semibold -mt-[2px]">
            <MotionNumber
              value={newTotalSize}
              style={{ lineHeight: 0.8 }}
              transition={{
                y: { type: 'spring', duration: 0.35, bounce: 0 },
              }}
              className="font-mono"
            />
          </span>{' '}
          GB
        </span>
      </div>
      <div className="relative">
        <div
          className={cn(
            'h-[34px] relative border rounded-sm w-full',
            showNewBar ? 'bg-[hsl(var(--chart-1))]' : 'bg-surface-200'
          )}
        >
          <AnimatePresence>
            {!showNewBar ? (
              <motion.div
                key="currentBar"
                initial={{ rotateY: 90, zIndex: 2 }}
                animate={{ rotateY: 0, zIndex: 1 }}
                exit={{ rotateY: -90, zIndex: 2 }}
                transition={{ duration: 0.3 }}
                style={{ transformOrigin: 'left center', backfaceVisibility: 'hidden' }}
                className="absolute inset-0 rounded-sm overflow-hidden"
              >
                <div className="h-full flex">
                  <div
                    className="bg-foreground relative overflow-hidden transition-all duration-500 ease-in-out"
                    style={{ width: `${usedPercentage}%` }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `repeating-linear-gradient(
                            -45deg,
                            rgba(255,255,255,0.1),
                            rgba(255,255,255,0.1) 1px,
                            transparent 1px,
                            transparent 4px
                          )`,
                      }}
                    />
                  </div>
                  <div
                    className="bg-transparent border-r transition-all duration-500 ease-in-out"
                    style={{ width: `${resizePercentage - usedPercentage}%` }}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="newBar"
                initial={{ rotateY: -90, zIndex: 2 }}
                animate={{ rotateY: 0, zIndex: 1 }}
                exit={{ rotateY: 90, zIndex: 2 }}
                transition={{ duration: 0.3 }}
                style={{ transformOrigin: 'left center', backfaceVisibility: 'hidden' }}
                className="absolute inset-0 rounded-sm overflow-hidden"
              >
                <div className="h-full flex">
                  <div
                    className="bg-foreground relative overflow-hidden transition-all duration-500 ease-in-out"
                    style={{ width: `${newUsedPercentage}%` }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `repeating-linear-gradient(
                            -45deg,
                            rgba(255,255,255,0.1),
                            rgba(255,255,255,0.1) 1px,
                            transparent 1px,
                            transparent 4px
                          )`,
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {showNewBar && (
              <motion.span
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                transition={{
                  duration: 0.12,
                  delay: 0.12,
                }}
                className={cn(
                  badgeVariants({ variant: 'default' }),
                  'absolute right-2 top-1 bg-alternative bg-opacity-100 text-background bg-[hsl(var(--chart-1))]'
                )}
              >
                New disk size
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence mode="wait">
          {!showNewBar && (
            <motion.div
              key="currentSize"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.1 }}
              className="absolute h-8 w-full -mx-[2px]"
            >
              <div
                className="absolute top-0 -left-0 h-full flex items-center transition-all duration-500 ease-in-out"
                style={{ left: `${showNewBar ? newResizePercentage : resizePercentage}%` }}
              >
                <div className="absolute right-full bottom-0 border mr-2 px-2 py-1 bg-surface-400 rounded text-xs text-foreground-light whitespace-nowrap">
                  {/* Resize point: {(showNewBar ? newResizePoint : resizePoint).toFixed(2)} GB */}
                  Autoscaling
                </div>
                <div className="w-px h-full bg-border"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex items-center space-x-4 text-xs text-foreground-lighter">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-foreground mr-2"></div>
          <span>Used Space</span>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-border border border-strong mr-2"></div>
          <span>Available space</span>
        </div>
      </div>
    </div>
  )
}

// ;<span className="text-foreground-light text-sm font-mono">
//   {usedSize.toFixed(2)} GB used of{' '}
//   <AnimatePresence mode="wait">
//     {!showNewBar ? (
//       <motion.span
//         key="currentSize"
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         transition={{ duration: 0.2 }}
//       >
//         {totalSize.toFixed(2)}
//       </motion.span>
//     ) : (
//       <motion.span
//         key="newSize"
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         transition={{ duration: 0.2 }}
//         className="text-foreground font-semibold"
//       >
//         <MotionNumber
//           value={newTotalSize.toFixed(2)}
//           style={{ lineHeight: 0.8 }}
//           transition={{
//             y: { type: 'spring', duration: 0.35, bounce: 0 },
//           }}
//           //   format={{ notation: 'compact' }} // Intl.NumberFormat() options
//           locales="en-US" // Intl.NumberFormat() locales
//         />
//       </motion.span>
//     )}
//   </AnimatePresence>{' '}
//   GB
// </span>

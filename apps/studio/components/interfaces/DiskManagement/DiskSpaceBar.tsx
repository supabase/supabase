'use client'

import React, { useState } from 'react'
import { badgeVariants, cn, Input_Shadcn_ } from 'ui'
import { Button } from 'ui'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import MotionNumber from 'motion-number'

export default function DiskSpaceBar() {
  const [totalSize, setTotalSize] = useState<number>(8) // 8 GB total disk size
  const [usedSize, setUsedSize] = useState<number>(4) // Starting with 4 GB used (50% usage)
  const [resizeThreshold, setResizeThreshold] = useState<number>(0.5) // 500 MB threshold for resize
  const [newTotalSize, setNewTotalSize] = useState<number>(totalSize)
  const [error, setError] = useState<string | null>(null)

  const freeSize = totalSize - usedSize
  const usedPercentage = (usedSize / totalSize) * 100
  const resizePoint = totalSize - resizeThreshold
  const resizePercentage = (resizePoint / totalSize) * 100

  const newUsedPercentage = (usedSize / newTotalSize) * 100
  const newResizePoint = newTotalSize - resizeThreshold
  const newResizePercentage = (newResizePoint / newTotalSize) * 100

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTotalSize >= totalSize) {
      setTotalSize(newTotalSize)
      setError(null)
    } else {
      setError(`New total size must be at least ${totalSize} GB`)
    }
  }

  const showNewBar = newTotalSize !== totalSize && newTotalSize > totalSize

  const resetNewTotalSize = () => {
    setNewTotalSize(totalSize)
    setError(null)
  }

  return (
    <div className="w-full">
      <div className="flex gap-10 w-full">
        {/* Admin Buttons */}
        {/* <div className="p-4 bg-gray-100 rounded-md space-y-2">
          <h3 className="font-medium text-sm mb-2">Admin Controls</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm w-32">Total Disk Size:</span>
            <Input_Shadcn_
              type="number"
              value={totalSize}
              onChange={(e) => setTotalSize(Math.max(usedSize, parseFloat(e.target.value) || 0))}
              className="w-24"
            />
            <Button onClick={() => setTotalSize((prev) => prev + 1)}>+1 GB</Button>
            <Button onClick={() => setTotalSize((prev) => Math.max(usedSize, prev - 1))}>
              -1 GB
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm w-32">Used Disk Size:</span>
            <Input_Shadcn_
              type="number"
              value={usedSize}
              onChange={(e) =>
                setUsedSize(Math.min(totalSize, Math.max(0, parseFloat(e.target.value) || 0)))
              }
              className="w-24"
            />
            <Button onClick={() => setUsedSize((prev) => Math.min(totalSize, prev + 0.5))}>
              +0.5 GB
            </Button>
            <Button onClick={() => setUsedSize((prev) => Math.max(0, prev - 0.5))}>-0.5 GB</Button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm w-32">Resize Threshold:</span>
            <Input_Shadcn_
              type="number"
              value={resizeThreshold}
              onChange={(e) =>
                setResizeThreshold(
                  Math.min(totalSize, Math.max(0, parseFloat(e.target.value) || 0))
                )
              }
              className="w-24"
            />
            <Button onClick={() => setResizeThreshold((prev) => Math.min(totalSize, prev + 0.1))}>
              +0.1 GB
            </Button>
            <Button onClick={() => setResizeThreshold((prev) => Math.max(0, prev - 0.1))}>
              -0.1 GB
            </Button>
          </div>
        </div> */}

        <div className="grow flex flex-col gap-2">
          <div className="flex items-center h-6 gap-3">
            <span className="text-foreground-light text-sm font-mono flex items-center gap-2">
              {usedSize.toFixed(2)} GB used of{' '}
              <span
                // key="newSize"
                // initial={{ opacity: 0 }}
                // animate={{ opacity: 1 }}
                // exit={{ opacity: 0 }}
                // transi. tion={{ duration: 0.2 }}
                className="text-foreground font-semibold -mt-[2px]"
              >
                <MotionNumber
                  value={newTotalSize.toFixed(2)}
                  style={{ lineHeight: 0.8 }}
                  transition={{
                    y: { type: 'spring', duration: 0.35, bounce: 0 },
                  }}
                  className="font-mono"
                  //   format={{ notation: 'compact' }}
                  //   format={{ notation: 'compact' }} // Intl.NumberFormat() options
                  locales="en-US" // Intl.NumberFormat() locales
                />
              </span>{' '}
              GB
            </span>
            <AnimatePresence>
              {showNewBar && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.1 }}
                  className={cn(badgeVariants({ variant: 'default' }))}
                >
                  New DB Size
                </motion.span>
              )}
            </AnimatePresence>
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
                        className="bg-border transition-all duration-500 ease-in-out"
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
                      {/* <div
                        className="bg-[hsl(var(--chart-1))] transition-all duration-500 ease-in-out"
                        style={{ width: `${newResizePercentage - newUsedPercentage}%` }}
                      /> */}
                    </div>
                  </motion.div>
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
                      Resize point: {(showNewBar ? newResizePoint : resizePoint).toFixed(2)} GB
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
              <span>Available Until Resize</span>
            </div>
          </div>
        </div>

        {/* <div className="text-right text-gray-500 text-sm font-mono transition-all duration-500 ease-in-out">
          {freeSize.toFixed(2)} GB free
        </div> */}

        {/* New Form */}
        {/* <form onSubmit={handleSubmit} className="space-y-4 min-w-60"> */}
        <div>
          <FormItemLayout label="Disk Size (GB)" isReactForm={false}>
            <div className="mt-1 relative flex gap-2">
              <Input_Shadcn_
                id="newTotalSize"
                type="number"
                step="0.01"
                value={newTotalSize}
                onChange={(e) => {
                  const value = parseFloat(e.target.value)
                  //   setNewTotalSize(value <= totalSize ? totalSize : value)
                  setNewTotalSize(value)
                }}
                className="max-w-20"
                onWheel={(e) => e.currentTarget.blur()}
              />
              {showNewBar && (
                <Button
                  htmlType="button"
                  type="secondary"
                  size="small"
                  onClick={resetNewTotalSize}
                  className="inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
            </div>
          </FormItemLayout>
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
        {/* <Button htmlType="submit">Update Total Size</Button> */}
        {/* </form> */}
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

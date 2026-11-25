'use client'

import { motion, useInView, type Transition } from 'motion/react'
import React, { FC, useRef, useState } from 'react'
import { cn, Switch } from 'ui'

interface Props {
  className?: string
}

const SPEND_CAP = 50

const barHeightTransition: Transition = { ease: [0.11, 0.04, 0, 1], duration: 0.3 }

const CostControlAnimation: FC<Props> = ({ className }) => {
  const [hasSpendCap, setHasSpendCap] = useState(true)
  const ref = useRef(null)
  const isInView = useInView(ref, { margin: '-25%', once: true })

  const toggleSpendCap = () => setHasSpendCap(!hasSpendCap)

  const bars = [{ y: 30 }, { y: 45 }, { y: 55 }, { y: 65 }, { y: 80 }]

  const getBarHeight = (y: number) => `${hasSpendCap ? Math.min(y, SPEND_CAP) : y}%`

  const barVariant = {
    hidden: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0,
      },
    },
    enabled: (i: number) => ({
      height: '100%',
      opacity: 1,
      transition: {
        ease: [0.11, 0.04, 0, 1],
        duration: 0.17,
        delay: i * 0.075,
      },
    }),
  }

  return (
    <div
      ref={ref}
      className={cn(
        'relative w-full aspect-video border rounded-lg bg-alternative overflow-hidden pointer-events-none',
        hasSpendCap ? 'spendcap-enabled' : 'spendcap-disabled',
        className
      )}
    >
      <div className="absolute z-30 border left-2 top-2 rounded-full pointer-events-auto bg-alternative p-1 shadow-sm flex items-center gap-1">
        <Switch checked={hasSpendCap} onCheckedChange={toggleSpendCap} />
        <span className="text-sm text-foreground-light mr-1">
          Spend Cap {hasSpendCap ? 'On' : 'Off'}
        </span>
      </div>
      <div className="absolute inset-0 z-20 w-full h-full flex items-center justify-center">
        <span
          aria-hidden="true"
          className={cn(
            'h-0.5 w-full transition-shadow',
            hasSpendCap ? 'groove-primary' : 'groove-page'
          )}
        />
      </div>
      <div className="absolute inset-0 z-10 w-full h-full flex justify-between items-end px-16 p-8">
        {bars.map((bar, index) => (
          <motion.div
            key={bar.y}
            className="w-[6%] overflow-hidden flex flex-col justify-end"
            initial={false}
            animate={{ height: getBarHeight(bar.y) }}
            transition={barHeightTransition}
          >
            <motion.span
              custom={index}
              variants={barVariant}
              initial="hidden"
              animate={isInView ? 'enabled' : 'hidden'}
              className="w-full bg-surface-200 border-stronger border-2 rounded-sm h-0"
            />
          </motion.div>
        ))}
        <div className="z-20 absolute inset-0 w-full h-1/2 overflow-hidden">
          <div className="absolute inset-0 w-full h-[200%] flex justify-between items-end px-16 p-8">
            {bars.map((bar, index) => (
              <motion.div
                key={bar.y}
                className="relative w-[6%] flex flex-col justify-end"
                initial={false}
                animate={{ height: getBarHeight(bar.y) }}
                transition={barHeightTransition}
              >
                <motion.span
                  custom={index}
                  variants={barVariant}
                  initial="hidden"
                  animate={isInView ? 'enabled' : 'hidden'}
                  className="relative w-full bg-warning-400 border-warning border-2 rounded-sm h-0"
                >
                  {bar.y > SPEND_CAP && (
                    <span
                      className={cn(
                        'absolute left-0 right-0 mx-auto -top-7 font-mono text-center w-full text-warning transition-opacity',
                        hasSpendCap && 'opacity-0'
                      )}
                    >
                      $
                    </span>
                  )}
                </motion.span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <Grid />
    </div>
  )
}

const Grid = () => (
  <div className="absolute z-0 inset-0 w-full h-full flex flex-col justify-between">
    <span className="w-full" />
    <span className="w-full h-px bg-surface-300" />
    <span className="w-full h-px bg-surface-300" />
    <span className="w-full h-px bg-surface-300" />
    <span className="w-full h-px bg-surface-300" />
    <span className="w-full h-px bg-surface-300" />
    <span className="w-full" />
  </div>
)

export default CostControlAnimation

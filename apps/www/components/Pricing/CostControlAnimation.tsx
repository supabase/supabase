import React, { FC, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { Switch, cn } from 'ui'

interface Props {
  className?: string
}

const CostControlAnimation: FC<Props> = ({ className }) => {
  const [hasSpendCap, setHasSpendCap] = useState(true)
  const ref = useRef(null)
  const isInView = useInView(ref, { margin: '-25%', once: true })

  const toggleSpendCap = () => setHasSpendCap(!hasSpendCap)

  const bars = [{ y: 30 }, { y: 45 }, { y: 55 }, { y: 65 }, { y: 80 }]

  const variants = {
    hidden: {
      opacity: 0,
      transition: {
        when: 'beforeChildren',
        duration: 0.2,
      },
    },
    enabled: {
      opacity: 1,
      transition: {
        when: 'beforeChildren',
        duration: 0,
      },
    },
  }
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
      <div className="absolute z-30 border left-2 top-2 rounded-full pointer-events-auto bg-alternative p-1 shadow flex items-center gap-1">
        <Switch checked={hasSpendCap} onCheckedChange={toggleSpendCap} />
        <span className="text-sm text-foreground-light mr-1">
          Spend Cap {hasSpendCap ? 'On' : 'Off'}
        </span>
      </div>
      <div className="absolute inset-0 z-20 w-full h-full flex items-center justify-center">
        <span
          className={cn(
            'w-full h-px border border-b border-dashed transition-all opacity-90 border-strong',
            hasSpendCap && 'opacity-100 border-warning'
          )}
        />
      </div>
      <div className="w-full h-full">
        <AnimatePresence mode="wait">
          {hasSpendCap && (
            <motion.div
              key="enabled"
              initial="hidden"
              animate={isInView && 'enabled'}
              exit="hidden"
              variants={variants}
              className="absolute inset-0 z-10 w-full h-full flex justify-between items-end px-16 p-8"
            >
              {bars.map((bar, index) => (
                <div
                  key={`enabled-${index}`}
                  className="w-[6%] h-full overflow-hidden flex flex-col justify-end"
                  style={{ height: (bar.y > 50 ? 50 : bar.y) + '%' }}
                >
                  <motion.span
                    custom={index}
                    variants={barVariant}
                    className={cn(
                      'w-full bg-surface-200 border-stronger border-2 rounded h-0 transform transition-all'
                    )}
                  />
                </div>
              ))}
            </motion.div>
          )}
          {!hasSpendCap && (
            <motion.div
              key="disabled"
              initial="hidden"
              animate={isInView && 'enabled'}
              exit="hidden"
              variants={variants}
              className="absolute inset-0 z-10 w-full h-full flex justify-between items-end px-16 p-8"
            >
              {bars.map((bar, index) => (
                <div
                  key={`disabled-gold-${index}`}
                  className="w-[6%] h-full overflow-hidden flex flex-col justify-end transition-all"
                  style={{ height: bar.y + '%' }}
                >
                  <motion.span
                    custom={index}
                    variants={barVariant}
                    className={cn(
                      'w-full bg-surface-200 border-stronger border-2 rounded h-0 transform transition-all'
                    )}
                  />
                </div>
              ))}
              <div className="z-20 absolute inset-0 w-full h-1/2 overflow-hidden">
                <div className="absolute inset-0 w-full h-[200%] flex justify-between items-end px-16 p-8">
                  {bars.map((bar, index) => (
                    <div
                      key={`disabled-gold-${index}`}
                      className="relative w-[6%] h-full flex flex-col justify-end transition-all"
                      style={{ height: bar.y + '%' }}
                    >
                      <motion.span
                        custom={index}
                        variants={barVariant}
                        className={cn(
                          'relative w-full bg-warning-400 border-warning border-2 rounded h-0 transform transition-all'
                        )}
                      >
                        {bar.y > 50 && (
                          <span className="absolute left-0 right-0 mx-auto -top-7 font-mono text-center w-full text-warning">
                            $
                          </span>
                        )}
                      </motion.span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

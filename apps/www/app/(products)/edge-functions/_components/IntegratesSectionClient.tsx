'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Database, HardDrive, Shield, Webhook, Zap } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { cn } from 'ui'

const ICONS = { Zap, Database, Webhook, Shield, HardDrive } as const

type IconName = keyof typeof ICONS

type UseCase = {
  icon: IconName
  label: string
  paragraph: React.ReactNode
  darkHtml: string
  lightHtml: string
}

const INTERVAL_DURATION = 6000 // ms per tab

export function IntegratesSectionClient({ useCases }: { useCases: UseCase[] }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<ReturnType | null>(null)
  const { ref: inViewRef, inView } = useInView({ threshold: 0.3 })
  const active = useCases[activeIdx]

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    clearTimer()
    setProgress(0)
    const updateFrequency = 30
    const increment = (100 / INTERVAL_DURATION) * updateFrequency
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment
        if (next >= 100) return 100
        return next
      })
    }, updateFrequency)
  }, [clearTimer])

  // Auto-advance when progress completes
  useEffect(() => {
    if (progress >= 100) {
      setActiveIdx((prev) => (prev + 1) % useCases.length)
    }
  }, [progress, useCases.length])

  // Start/stop timer based on visibility
  useEffect(() => {
    if (inView) {
      startTimer()
    } else {
      clearTimer()
    }
    return clearTimer
  }, [inView, activeIdx, startTimer, clearTimer])

  const handleTabClick = (index: number) => {
    setActiveIdx(index)
    startTimer()
  }

  return (
    <div ref={inViewRef} className="py-24 flex flex-col gap-16">
      {/* Header */}
      <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-end">
          <h3 className="text-2xl md:text-4xl text-foreground-lighter max-w-xl">
            Integrates with the <span className="text-foreground">Supabase ecosystem</span>
          </h3>
          <p className="text-foreground-lighter text-sm lg:text-base">
            Access your database, auth, storage, and webhooks directly from Edge Functions with zero
            configuration.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: tab cards */}
          <div className="flex flex-col gap-1 items-start justify-end">
            {useCases.map((useCase, index) => {
              const isActive = index === activeIdx
              const Icon = ICONS[useCase.icon]
              return (
                <button
                  key={useCase.label}
                  onClick={() => handleTabClick(index)}
                  className={cn(
                    'text-left flex items-center gap-3 py-2 text-2xl transition-colors',
                    isActive
                      ? 'text-foreground'
                      : 'text-foreground-muted hover:text-foreground-light'
                  )}
                >
                  <Icon size={22} strokeWidth={1.5} />
                  {useCase.label}
                </button>
              )
            })}
          </div>

          {/* Right: code area */}
          <div className="flex flex-col border border-border rounded-md overflow-clip">
            <div className="relative h-[440px] shrink-0 overflow-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.15, delay: 0.05 } }}
                  exit={{ opacity: 0, transition: { duration: 0.05 } }}
                >
                  <div
                    dangerouslySetInnerHTML={{ __html: active.darkHtml }}
                    className="hidden dark:block [&_pre]:!bg-transparent [&_pre]:m-0 [&_pre]:p-6"
                    style={{ fontSize: '0.8125rem', fontWeight: 500, lineHeight: 1.7 }}
                  />
                  <div
                    dangerouslySetInnerHTML={{ __html: active.lightHtml }}
                    className="block dark:hidden [&_pre]:!bg-transparent [&_pre]:m-0 [&_pre]:p-6"
                    style={{ fontSize: '0.8125rem', fontWeight: 500, lineHeight: 1.7 }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer: active tab info */}
            <div className="border-t border-border px-6 py-4 flex items-center gap-8 justify-between bg-surface-75">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.15, delay: 0.05 } }}
                  exit={{ opacity: 0, transition: { duration: 0.05 } }}
                  className="flex flex-col gap-1"
                >
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                    {(() => {
                      const Icon = ICONS[active.icon]
                      return <Icon size={14} strokeWidth={2} />
                    })()}
                    {active.label}
                  </h4>
                  <p className="text-sm text-foreground-lighter">{active.paragraph}</p>
                </motion.div>
              </AnimatePresence>
              <Link
                href="/docs/guides/functions"
                className="flex items-center gap-1.5 rounded-full bg-surface-100 border border-border px-3 py-1.5 text-xs text-foreground-light hover:text-foreground hover:bg-surface-200 transition-colors whitespace-nowrap shrink-0"
              >
                Documentation
                <svg
                  width={12}
                  height={12}
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0"
                >
                  <path
                    d="M3.5 2.5H9.5V8.5M9.5 2.5L2.5 9.5"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

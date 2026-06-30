'use client'

import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { Database, HardDrive, Shield, Webhook, Zap } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inViewRef = useRef<HTMLDivElement>(null)
  const inView = useInView(inViewRef, { amount: 0.3 })
  const active = useCases[activeIdx]

  // Auto-size the code area to the active snippet. We measure an always-mounted,
  // invisible copy of the current code so the target height is known immediately on
  // switch (and doesn't collapse during the cross-fade), then animate `height` to it.
  const measureRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number>()
  const hasMeasured = useRef(false)

  useEffect(() => {
    const el = measureRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight))
    ro.observe(el)
    setHeight(el.offsetHeight)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (height != null) hasMeasured.current = true
  }, [height])

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
    <SectionContainerWithCn ref={inViewRef} spacing="sections">
      {/* Header */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
        <h3 className="text-2xl md:text-4xl text-foreground-lighter max-w-xl text-balance">
          Integrates with the <span className="text-foreground">Supabase ecosystem</span>
        </h3>
        <p className="text-foreground-lighter text-sm lg:text-base">
          Access your database, auth, storage, and webhooks directly from Edge Functions with zero
          configuration.
        </p>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: tab cards */}
        <div
          role="tablist"
          aria-label="Edge Functions integrations"
          className="flex flex-col gap-1 items-start justify-end"
        >
          {useCases.map((useCase, index) => {
            const isActive = index === activeIdx
            const Icon = ICONS[useCase.icon]
            return (
              <button
                key={useCase.label}
                role="tab"
                aria-selected={isActive}
                aria-controls={`ef-integrates-panel-${index}`}
                id={`ef-integrates-tab-${index}`}
                onClick={() => handleTabClick(index)}
                className={cn(
                  'text-left flex items-center gap-3 py-2 text-2xl transition-colors',
                  isActive ? 'text-foreground' : 'text-foreground-muted hover:text-foreground-light'
                )}
              >
                <Icon size={22} strokeWidth={1.5} aria-hidden />
                {useCase.label}
              </button>
            )
          })}
        </div>

        {/* Right: code area */}
        <div
          role="tabpanel"
          id={`ef-integrates-panel-${activeIdx}`}
          aria-labelledby={`ef-integrates-tab-${activeIdx}`}
          className="flex flex-col self-end border border-border rounded-md overflow-clip"
        >
          <motion.div
            initial={false}
            animate={height != null ? { height } : undefined}
            transition={
              hasMeasured.current ? { duration: 0.35, ease: [0.22, 1, 0.36, 1] } : { duration: 0 }
            }
            className="relative shrink-0 overflow-hidden"
          >
            {/* Invisible measuring copy: drives the animated code-area height */}
            <div
              ref={measureRef}
              aria-hidden
              className="pointer-events-none invisible absolute inset-x-0 top-0 overflow-x-auto [&_pre]:!bg-transparent [&_pre]:m-0 [&_pre]:p-6"
              style={{ fontSize: '0.8125rem', fontWeight: 500, lineHeight: 1.7 }}
              dangerouslySetInnerHTML={{ __html: active.darkHtml }}
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={active.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.15, delay: 0.05 } }}
                exit={{ opacity: 0, transition: { duration: 0.05 } }}
                className="overflow-x-auto"
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
          </motion.div>

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
                <h4 className="text-sm font-medium text-foreground">{active.label}</h4>
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
                aria-hidden
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
    </SectionContainerWithCn>
  )
}

'use client'

import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from 'ui'

type RLSExample = {
  title: string
  description: string
  darkHtml: string
  lightHtml: string
}

const INTERVAL_DURATION = 10000

export function RLSSectionClient({ examples }: { examples: RLSExample[] }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inViewRef = useRef<HTMLDivElement>(null)
  const inView = useInView(inViewRef, { amount: 0.3 })
  const active = examples[activeIdx]

  // Auto-size the code panel to the active snippet. We measure an always-mounted,
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

  useEffect(() => {
    if (progress >= 100) {
      setActiveIdx((prev) => (prev + 1) % examples.length)
    }
  }, [progress, examples.length])

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
        <h3 className="text-2xl md:text-4xl text-foreground-lighter max-w-xl">
          User permissions
          <br />
          <span className="text-foreground">without the middleware</span>
        </h3>
        <p className="text-foreground-lighter text-sm lg:text-base">
          Build authorization rules with Postgres Row Level Security — control who can create, edit,
          and delete specific rows in your database. No additional servers required.
        </p>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: tabs */}
        <div
          role="tablist"
          aria-label="RLS policy examples"
          className="flex flex-col gap-3 items-start justify-end"
        >
          {examples.map((example, index) => {
            const isActive = index === activeIdx
            return (
              <button
                key={example.title}
                role="tab"
                aria-selected={isActive}
                aria-controls={`rls-panel-${index}`}
                id={`rls-tab-${index}`}
                onClick={() => handleTabClick(index)}
                className={cn(
                  'text-left flex flex-col gap-0.5 py-2 transition-colors',
                  isActive ? 'text-foreground' : 'text-foreground-muted hover:text-foreground-light'
                )}
              >
                <span className="text-2xl font-medium">{example.title}</span>
                <span
                  className={cn(
                    'text-sm transition-colors',
                    isActive ? 'text-foreground-lighter' : 'text-foreground-muted'
                  )}
                >
                  {example.description}
                </span>
              </button>
            )
          })}
        </div>

        {/* Right: code block */}
        <motion.div
          role="tabpanel"
          id={`rls-panel-${activeIdx}`}
          aria-labelledby={`rls-tab-${activeIdx}`}
          initial={false}
          animate={height != null ? { height } : undefined}
          transition={
            hasMeasured.current ? { duration: 0.35, ease: [0.22, 1, 0.36, 1] } : { duration: 0 }
          }
          className="relative self-end overflow-hidden border border-border rounded-md"
        >
          {/* Invisible measuring copy: drives the animated container height */}
          <div
            ref={measureRef}
            aria-hidden
            className="pointer-events-none invisible absolute inset-x-0 top-0 overflow-x-auto pb-12 [&_pre]:!bg-transparent [&_pre]:m-0 [&_pre]:p-6"
            style={{ fontSize: '0.8125rem', fontWeight: 500, lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: active.darkHtml }}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={active.title}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.15, delay: 0.05 } }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className="overflow-x-auto pb-12"
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
          <Link
            href="/docs/guides/database/postgres/row-level-security"
            className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-surface-100 border border-border px-3 py-1.5 text-xs text-foreground-light hover:text-foreground hover:bg-surface-200 transition-colors whitespace-nowrap"
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
        </motion.div>
      </div>
    </SectionContainerWithCn>
  )
}

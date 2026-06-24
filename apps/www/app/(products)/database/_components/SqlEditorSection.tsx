'use client'

import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { Code, FileDown, Heart, MousePointerClick } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from 'ui'

const ICONS = { Code, MousePointerClick, Heart, FileDown } as const

type IconName = keyof typeof ICONS

const TABS = [
  {
    icon: 'Code' as IconName,
    label: 'Full SQL',
    description: 'A full SQL editor built right into the dashboard.',
    image: {
      dark: '/images/product/database/sql-view/sql-editor.png',
      light: '/images/product/database/sql-view/sql-editor-light.png',
    },
  },
  {
    icon: 'MousePointerClick' as IconName,
    label: 'Monaco editor',
    description: 'Built-in Monaco editor, with rich validation and autocomplete.',
    image: {
      dark: '/images/product/database/sql-view/monaco-editor.png',
      light: '/images/product/database/sql-view/monaco-editor-light.png',
    },
  },
  {
    icon: 'Heart' as IconName,
    label: 'Favorite queries',
    description: 'Save your favorite queries to use again and again.',
    image: {
      dark: '/images/product/database/sql-view/favorites.png',
      light: '/images/product/database/sql-view/favorites-light.png',
    },
  },
  {
    icon: 'FileDown' as IconName,
    label: 'Export to CSV',
    description: 'Any output can be exported into a CSV.',
    image: {
      dark: '/images/product/database/sql-view/export.png',
      light: '/images/product/database/sql-view/export-csv-light.png',
    },
  },
]

const INTERVAL_DURATION = 8000

export function SqlEditorSection() {
  const [activeIdx, setActiveIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inViewRef = useRef<HTMLDivElement>(null)
  const inView = useInView(inViewRef, { amount: 0.3 })
  const active = TABS[activeIdx]

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
      setActiveIdx((prev) => (prev + 1) % TABS.length)
    }
  }, [progress])

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
    <SectionContainerWithCn ref={inViewRef} className="space-y-8 md:space-y-24">
      {/* Header */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
        <h3 className="text-2xl md:text-4xl text-foreground-lighter max-w-xl">
          Write and run queries with a
          <br />
          <span className="text-foreground">full SQL Editor</span>
        </h3>
        <p className="text-foreground-lighter text-sm lg:text-base">
          Write, run, and save SQL queries directly from the dashboard with full autocomplete and
          syntax highlighting.
        </p>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: tabs */}
        <div className="flex flex-col gap-1 items-start justify-end">
          {TABS.map((tab, index) => {
            const isActive = index === activeIdx
            const Icon = ICONS[tab.icon]
            return (
              <button
                key={tab.label}
                onClick={() => handleTabClick(index)}
                className={cn(
                  'text-left flex items-center gap-3 py-2 text-2xl font-medium transition-colors',
                  isActive ? 'text-foreground' : 'text-foreground-muted hover:text-foreground-light'
                )}
              >
                <Icon size={22} strokeWidth={1.5} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Right: image + footer */}
        <div className="flex flex-col border border-border rounded-md overflow-clip bg-surface-75">
          <div className="relative aspect-[16/7.5] shrink-0 overflow-hidden rounded-t-md flex items-end justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.05 } }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                className="absolute inset-0 flex items-end justify-center px-6"
              >
                <img
                  src={active.image.dark}
                  alt={active.label}
                  className="absolute inset-0 object-cover pointer-events-none hidden dark:block"
                />
                <img
                  src={active.image.light}
                  alt={active.label}
                  className="absolute inset-0 object-cover pointer-events-none dark:hidden"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer: active tab info */}
          <div className="border-t border-border px-6 py-4 flex items-center gap-8 justify-between bg-surface-100">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.15, delay: 0.05 } }}
                exit={{ opacity: 0, transition: { duration: 0.05 } }}
                className="flex flex-col gap-1"
              >
                <h4 className="text-sm font-medium text-foreground">{active.label}</h4>
                <p className="text-sm text-foreground-lighter">{active.description}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </SectionContainerWithCn>
  )
}

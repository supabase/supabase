'use client'

import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { FileDown, Link2, Table, TableProperties } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from 'ui'

const ICONS = { TableProperties, Table, Link2, FileDown } as const

type IconName = keyof typeof ICONS

type Tab = {
  icon: IconName
  label: string
  description: string
  image: { dark: string; light: string }
}

const TABS: Tab[] = [
  {
    icon: 'TableProperties',
    label: 'Spreadsheet editing',
    description: 'Add, edit, and update your data with the simplicity of a no-code tool.',
    image: {
      dark: '/images/product/database/table-view/spreadsheet.png',
      light: '/images/product/database/table-view/table-editor-light.png',
    },
  },
  {
    icon: 'Table',
    label: 'Create tables',
    description: 'Add tables, columns and rows without writing SQL.',
    image: {
      dark: '/images/product/database/table-view/create-tables.png',
      light: '/images/product/database/table-view/create-table-light.png',
    },
  },
  {
    icon: 'Link2',
    label: 'Foreign keys',
    description: 'Build connections across tables with the full power of relational data.',
    image: {
      dark: '/images/product/database/table-view/foreign-keys.png',
      light: '/images/product/database/table-view/foreign-keys-light.png',
    },
  },
  {
    icon: 'FileDown',
    label: 'Export to CSV',
    description: 'Pick the rows you want and export them into a CSV.',
    image: {
      dark: '/images/product/database/table-view/export-csv.png',
      light: '/images/product/database/table-view/export-csv-light.png',
    },
  },
]

const INTERVAL_DURATION = 8000

export function TableEditorSection() {
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
          Manage your data with a
          <br />
          <span className="text-foreground">built-in Table Editor</span>
        </h3>
        <p className="text-foreground-lighter text-sm lg:text-base">
          Manage your data with a spreadsheet-like interface. Create tables, set up relationships,
          and export — no SQL required.
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

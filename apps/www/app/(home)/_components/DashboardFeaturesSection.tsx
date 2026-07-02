'use client'

import BrowserFrame from '~/components/BrowserFrame'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { useTheme } from 'next-themes'
import React, { useRef, useState } from 'react'
import { cn } from 'ui'

import SectionContainer from '@/components/Layouts/SectionContainer'

export function DashboardFeaturesSection({
  title,
  tabs,
}: {
  title: React.ReactNode
  tabs: {
    label: string
    panel: React.FC<{ isDark: boolean }>
    highlights: { label: string; link?: string }[]
  }[]
}) {
  const { resolvedTheme } = useTheme()
  const [activeTabIdx, setActiveTabIdx] = useState(0)
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true })

  if (tabs.length === 0) return null

  const Panel = tabs[activeTabIdx].panel

  return (
    <SectionContainer ref={sectionRef} className="pt-10! pb-4! space-y-8 overflow-hidden">
      <div className="pt-12 flex flex-col gap-8">
        <h3 className="text-2xl md:text-4xl text-foreground-lighter">{title}</h3>
        <div className="flex gap-2" role="tablist">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTabIdx(index)}
              aria-selected={index === activeTabIdx}
              role="tab"
              className={cn(
                'py-1.5 px-3 lg:py-2 lg:px-8 border rounded-full bg-alternative hover:border-foreground text-sm opacity-80 transition-all',
                'hover:border-foreground-lighter hover:text-foreground',
                index === activeTabIdx ? 'opacity-100 !border-foreground' : ''
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <BrowserFrame
        className="overflow-hidden bg-default w-full mx-auto -mb-16"
        contentClassName="aspect-video overflow-hidden rounded-lg"
      >
        {isInView && (
          <AnimatePresence mode="wait">
            <motion.div
              key={tabs[activeTabIdx]?.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.1, delay: 0.2 } }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className="relative w-full max-w-full h-full"
            >
              <Panel
                key={String(resolvedTheme?.includes('dark'))}
                isDark={resolvedTheme?.includes('dark') ?? false}
              />
            </motion.div>
          </AnimatePresence>
        )}
      </BrowserFrame>
    </SectionContainer>
  )
}

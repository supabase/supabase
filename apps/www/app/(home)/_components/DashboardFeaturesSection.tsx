'use client'

import BrowserFrame from '~/components/BrowserFrame'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import React, { useRef, useState } from 'react'
import { cn } from 'ui'

const dashboardStories = [
  {
    logo: '/images/customers/logos/hyper-icon.svg',
    name: 'Hyper',
    quote:
      'We store embeddings in a PostgreSQL database, hosted by Supabase, to perform a similarity search to identify the most relevant sections within the MDN.',
    author: 'Hermina Condei, Director at MDN, Mozilla',
    slug: 'mozilla-mdn',
  },
  {
    logo: '/images/customers/logos/chatbase-icon.svg',
    name: 'Chatbase',
    quote:
      'The SQL Editor in Supabase is my favorite feature — it lets us run complex queries, debug issues, and iterate on our schema without ever leaving the browser.',
    author: 'Yasser Elsaid, Founder of Chatbase',
    slug: 'chatbase',
  },
  {
    logo: '/images/customers/logos/markprompt-icon.svg',
    name: 'Markprompt',
    quote:
      'Row Level Security in Supabase allows us to set granular access policies directly in Postgres, so our multi-tenant architecture stays secure by default.',
    author: 'Michael Fester, Co-Founder of Markprompt',
    slug: 'markprompt',
  },
]

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

  const Panel: any = tabs[activeTabIdx]?.panel ?? null
  const story = dashboardStories[activeTabIdx] ?? dashboardStories[0]

  return (
    <div className="border-b border-border">
      <div
        ref={sectionRef}
        className="relative mx-auto max-w-[var(--container-max-w,75rem)] px-6 pt-10 pb-4 overflow-hidden"
      >
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
          className="overflow-hidden bg-default w-full mx-auto translate-y-16"
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
                  key={resolvedTheme?.includes('dark')}
                  isDark={resolvedTheme?.includes('dark')}
                />
              </motion.div>
            </AnimatePresence>
          )}
        </BrowserFrame>
      </div>

      {/* Customer story banner */}
      <div className="border-t border-border">
        <div className="mx-auto max-w-[var(--container-max-w,75rem)] py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={story.slug}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 px-6 py-5"
            >
              <img
                src={story.logo}
                alt={story.name}
                className="h-8 w-8 shrink-0 object-contain grayscale opacity-80 dark:invert"
              />
              <div className="flex-1 min-w-0">
                <p className="text-foreground-lighter text-sm">
                  <span className="font-medium text-foreground">{story.name}</span>
                  {' — '}
                  {story.quote} <span className="text-foreground-muted">{story.author}</span>
                </p>
              </div>

              <Link
                href={`/customers/${story.slug}`}
                className="shrink-0 text-sm text-foreground-lighter hover:text-foreground transition-colors whitespace-nowrap"
              >
                View more about {story.name}
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

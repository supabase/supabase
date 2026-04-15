'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  Blocks,
  KeyRound,
  Link2,
  ListChecks,
  Rocket,
  Server,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { cn } from 'ui'

const EXAMPLE_ICONS: Record<string, LucideIcon> = {
  ListChecks,
  Users,
  Rocket,
  KeyRound,
  Link2,
  ShieldCheck,
  Blocks,
  Server,
}

type Framework = {
  name: string
  icon: string
  docsUrl: string
  darkHtml: string
  lightHtml: string
  examples: { title: string; description: string; url: string; icon: string }[]
}

export function FrameworksSectionClient({ frameworks }: { frameworks: Framework[] }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const prevIdx = useRef(0)
  const direction = activeIdx > prevIdx.current ? -1 : 1
  const active = frameworks[activeIdx]

  const handleTabChange = (index: number) => {
    prevIdx.current = activeIdx
    setActiveIdx(index)
  }

  return (
    <div className="border-b border-border py-24">
      <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-0">
          {/* Left: title + example cards */}
          <div className="flex flex-col justify-between py-4 gap-6 md:gap-10">
            <h3 className="text-2xl md:text-4xl text-foreground-lighter">
              Use Supabase with{' '}
              <span className="block">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={active.name}
                    initial={{ filter: 'blur(2px)', opacity: 0 }}
                    animate={{ filter: 'blur(0px)', opacity: 1, transition: { duration: 0.25 } }}
                    exit={{ filter: 'blur(2px)', opacity: 0, transition: { duration: 0.1 } }}
                    className="inline-block text-foreground"
                  >
                    {active.name}
                  </motion.span>
                </AnimatePresence>
              </span>
            </h3>

            {active.examples.length > 0 && (
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                <motion.div
                  key={active.name}
                  custom={direction}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  variants={{
                    enter: (d: number) => ({ opacity: 0, x: -28 * d, filter: 'blur(2px)' }),
                    center: {
                      opacity: 1,
                      x: 0,
                      filter: 'blur(0px)',
                      transition: { duration: 0.2, delay: 0.05 },
                    },
                    exit: (d: number) => ({
                      opacity: 0,
                      x: 28 * d,
                      filter: 'blur(2px)',
                      transition: { duration: 0.1 },
                    }),
                  }}
                  className="flex flex-col gap-1 md:max-w-sm"
                >
                  {active.examples.map((example) => {
                    const Icon = EXAMPLE_ICONS[example.icon]
                    return (
                      <Link
                        key={example.url}
                        href={example.url}
                        className="flex items-center gap-3 py-2 text-2xl font-medium text-foreground-light"
                      >
                        {Icon && <Icon size={22} strokeWidth={1.5} />}
                        {example.title}
                      </Link>
                    )
                  })}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Right: icon tabs + code */}
          <div className="border border-border flex flex-col rounded-md overflow-clip">
            {/* 6-col icon row */}
            <div className="grid grid-cols-6 border-b border-border">
              {frameworks.map((framework, index) => (
                <button
                  key={framework.name}
                  onClick={() => handleTabChange(index)}
                  className={cn(
                    'flex items-center justify-center py-4 border-r border-border last:border-r-0 transition-colors',
                    index === activeIdx
                      ? 'bg-surface-75 text-foreground'
                      : 'text-foreground-muted hover:text-foreground-light hover:bg-surface-75/50'
                  )}
                >
                  <svg
                    width={28}
                    height={28}
                    fillRule="evenodd"
                    clipRule="evenodd"
                    viewBox="0 0 61 61"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d={framework.icon} fill="currentColor" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Code area */}
            <div className="relative h-[440px] overflow-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.name}
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
              <Link
                href={active.docsUrl}
                className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-surface-100 border border-border px-3 py-1.5 text-xs text-foreground-light hover:text-foreground hover:bg-surface-200 transition-colors whitespace-nowrap"
              >
                Read docs for <span>{active.name}</span>
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

'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'
import { cn } from 'ui'

import SectionContainerWithCn from '../../../components/Layouts/SectionContainerWithCn'

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
  const active = frameworks[activeIdx]

  const handleTabChange = (index: number) => {
    setActiveIdx(index)
  }

  return (
    <div className="border-b border-border">
      <SectionContainerWithCn>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-0">
          {/* Left: title */}
          <div className="flex flex-col justify-between gap-6 md:gap-10">
            <h3 className="text-2xl md:text-4xl text-foreground-lighter">
              Use Supabase with{' '}
              <span className="md:block">
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
          </div>

          {/* Right: icon tabs + code */}
          <div className="border border-border flex flex-col rounded-md overflow-clip">
            {/* 6-col icon row */}
            <div
              role="tablist"
              aria-label="Framework"
              className="grid grid-cols-6 border-b border-border"
            >
              {frameworks.map((framework, index) => (
                <button
                  key={framework.name}
                  role="tab"
                  aria-selected={index === activeIdx}
                  aria-label={framework.name}
                  onClick={() => handleTabChange(index)}
                  className={cn(
                    'flex items-center justify-center py-4 border-r border-border last:border-r-0 transition-colors',
                    index === activeIdx
                      ? 'bg-surface-75 text-foreground'
                      : 'text-foreground-muted hover:text-foreground-light hover:bg-surface-75/50'
                  )}
                >
                  <svg
                    aria-hidden="true"
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
            <div
              role="tabpanel"
              aria-label={`${active.name} code example`}
              className="relative h-[440px] overflow-auto"
            >
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
                {`Read docs for ${active.name}`}
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
      </SectionContainerWithCn>
    </div>
  )
}

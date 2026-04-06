'use client'

import { useState } from 'react'
import { cn } from 'ui'

import type { GoFaqSection } from '../schemas'

export default function FaqSection({ section }: { section: GoFaqSection }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="max-w-[80rem] mx-auto px-8">
      {(section.title || section.description) && (
        <div className="mb-12">
          {section.title && (
            <h2 className="text-2xl sm:text-3xl font-medium text-foreground">{section.title}</h2>
          )}
          {section.description && (
            <p className="text-foreground-lighter mt-3 text-lg">{section.description}</p>
          )}
        </div>
      )}
      <div className="border border-muted rounded-xl overflow-hidden divide-y divide-muted">
        {section.items.map((item, i) => {
          const isOpen = openIndex === i
          return (
            <div key={i}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 p-6 sm:p-8 text-left"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                <span className="text-foreground font-medium text-base">{item.question}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cn(
                    'shrink-0 text-foreground-lighter transition-transform duration-200',
                    isOpen && 'rotate-180'
                  )}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div
                className={cn(
                  'grid transition-all duration-200',
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-6 sm:px-8 pb-6 sm:pb-8 text-foreground-lighter text-sm leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

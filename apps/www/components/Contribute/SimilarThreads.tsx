'use client'

import { ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Badge, Collapsible, cn } from 'ui'

export interface SimilarThread {
  id: string
  title: string
  url: string
  channel: 'discord' | 'reddit' | 'github'
  source: string // e.g., "r/webdev" or channel name
  posted: string // e.g., "2d ago", "1w ago"
  matchPercentage: number // 0-100
}

interface SimilarThreadsProps {
  threads: SimilarThread[]
}

export function SimilarThreads({ threads }: SimilarThreadsProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!threads || threads.length === 0) {
    return null
  }

  return (
    <div className="border border-border rounded-lg bg-surface-100 overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Collapsible.Trigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between px-6 py-4 bg-surface-200 hover:bg-surface-300 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-brand-500 text-white font-semibold text-sm">
                {threads.length}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-base font-semibold text-foreground">Similar threads found</span>
                <span className="text-sm text-foreground-lighter">View related discussions</span>
              </div>
            </div>
            <ChevronUp
              className={cn(
                'h-5 w-5 text-foreground-lighter transition-transform duration-200',
                isOpen && 'transform rotate-180'
              )}
            />
          </button>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <div className="divide-y divide-border">
            {threads.map((thread, index) => (
              <div
                key={thread.id || index}
                className="px-6 py-4 hover:bg-surface-200 transition-colors"
              >
                <Link
                  href={thread.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-4 group"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground group-hover:text-brand-600 transition-colors mb-1 line-clamp-2">
                      {thread.title}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-foreground-lighter">
                      <span>{thread.source}</span>
                      <span>·</span>
                      <span>{thread.posted}</span>
                    </div>
                  </div>
                  <Badge
                    variant="default"
                    className="bg-brand-100 text-brand-900 dark:bg-brand-900 dark:text-brand-100 border-brand-300 dark:border-brand-700 shrink-0"
                  >
                    {thread.matchPercentage}% match
                  </Badge>
                </Link>
              </div>
            ))}
          </div>
        </Collapsible.Content>
      </Collapsible>
    </div>
  )
}


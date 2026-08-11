'use client'

import ReactMarkdown from 'react-markdown'
import { cn } from 'ui'

import { useGuide } from './Guide'

interface GuideHeaderProps {
  className?: string
}

export function GuideHeader({ className }: GuideHeaderProps) {
  const { meta } = useGuide()

  return (
    <div className={cn('mb-8', className)}>
      <h1 className="mt-0 mb-0 [&>p]:m-0">
        <ReactMarkdown>{meta?.title || 'Supabase Docs'}</ReactMarkdown>
      </h1>
      {meta?.subtitle && (
        <div className="mt-3 not-prose [&_p]:text-xl [&_p]:leading-7 text-foreground-light [&>p]:m-0">
          <ReactMarkdown>{meta.subtitle}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}

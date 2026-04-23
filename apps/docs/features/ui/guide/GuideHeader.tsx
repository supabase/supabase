'use client'

import ReactMarkdown from 'react-markdown'
import { useGuide } from './Guide'

interface GuideHeaderProps {
  className?: string
}

export function GuideHeader({ className }: GuideHeaderProps) {
  const { meta } = useGuide()
  return (
    <div className={className}>
      <h1 className="mb-0 [&>p]:m-0">
        <ReactMarkdown>{meta?.title || 'Supabase Docs'}</ReactMarkdown>
      </h1>
      {meta?.subtitle && (
        <p className="mt-3 text-base text-foreground-light">
          <ReactMarkdown>{meta.subtitle}</ReactMarkdown>
        </p>
      )}
      <hr className="not-prose border-t-0 border-b my-8" />
    </div>
  )
}

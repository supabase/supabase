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
        <div className="mt-6 not-prose [&_p]:text-xl [&_p]:leading-7 text-foreground-light [&>p]:m-0">
          <ReactMarkdown>{meta.subtitle}</ReactMarkdown>
        </div>
      )}
      <hr className="not-prose border-t-0 border-b my-8" />
    </div>
  )
}

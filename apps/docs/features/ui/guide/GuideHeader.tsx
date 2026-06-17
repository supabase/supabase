'use client'

import ReactMarkdown from 'react-markdown'
import { Heading } from 'ui'

import { useGuide } from './Guide'

interface GuideHeaderProps {
  className?: string
}

export function GuideHeader({ className }: GuideHeaderProps) {
  const { meta } = useGuide()

  return (
    <div className={className}>
      <Heading tag="h1" className="mb-0 [&>p]:m-0">
        <ReactMarkdown>{meta?.title || 'Supabase Docs'}</ReactMarkdown>
      </Heading>
      {meta?.subtitle && (
        <h2 className="mt-3 text-xl text-foreground-light">
          <ReactMarkdown>{meta.subtitle}</ReactMarkdown>
        </h2>
      )}
      <hr className="not-prose border-t-0 border-b my-8" />
    </div>
  )
}

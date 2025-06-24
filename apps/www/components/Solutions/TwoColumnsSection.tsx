import React from 'react'
import Link from 'next/link'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { cn, TextLink } from 'ui'
import { useBreakpoint } from 'common'
import SectionContainer from 'components/Layouts/SectionContainer'

interface AIPrompt {
  id: string
  title: string
  description: string
  code: string
  language: string
  docsUrl: string
}

export interface TwoColumnsSectionProps {
  heading: string | React.ReactNode
  subheading?: string
  id?: string
  docsUrl?: string
  className?: string
  aiPrompts: AIPrompt[]
  leftFooter?: React.ReactNode
  headingRight?: string | React.ReactNode
}

const CodeSnippet = ({ prompt }: { prompt: AIPrompt }) => (
  <div className="relative group bg-surface-75 border border-default rounded-lg">
    <div className="flex items-center justify-between px-4 py-3 border-b border-default bg-surface-100">
      <h3 className="text-sm text-foreground truncate">{prompt.title}</h3>
      <Link href={prompt.docsUrl} className="relative">
        <ArrowUpRight className="w-4 h-4 not-sr-only stroke-1 opacity-80 transition-opacity group-hover:opacity-100" />
      </Link>
    </div>
    <div className="p-4">
      <pre className="text-xs text-foreground-light whitespace-pre-wrap font-mono leading-relaxed line-clamp-4">
        {prompt.code}
      </pre>
    </div>
  </div>
)

const TwoColumnsSection = ({
  heading,
  subheading,
  docsUrl,
  id,
  className,
  aiPrompts,
  leftFooter,
  headingRight,
}: TwoColumnsSectionProps) => {
  return (
    <SectionContainer id={id} className={cn('py-16 md:py-24', className)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        <div className="col-left space-y-6 lg:pr-10">
          <h2 className="h2 text-foreground-lighter">{heading}</h2>
          {subheading && <p className="text-foreground-light">{subheading}</p>}
          {leftFooter && leftFooter}
        </div>

        <div className="col-right space-y-6">
          <div className="space-y-4 max-w-sm">
            <h2 className="h2 text-foreground-lighter">{headingRight}</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-2">
            {aiPrompts.map((prompt) => (
              <CodeSnippet key={prompt.id} prompt={prompt} />
            ))}
          </div>

          {docsUrl && (
            <div className="pt-2">
              <TextLink url={docsUrl} label="View all prompts" />
            </div>
          )}
        </div>
      </div>
    </SectionContainer>
  )
}

export default TwoColumnsSection

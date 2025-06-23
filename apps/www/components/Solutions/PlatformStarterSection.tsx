import React from 'react'
import Link from 'next/link'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { cn, TextLink } from 'ui'
import { useBreakpoint } from 'common'
import SectionContainer from 'components/Layouts/SectionContainer'
import { frameworks } from '../Hero/HeroFrameworks'

interface Framework {
  name: string
  icon: string
  docs: string
}

interface AIPrompt {
  id: string
  title: string
  description: string
  code: string
  language: string
  docsUrl: string
}

export interface PlatformStarterSectionProps {
  heading: string | React.ReactNode
  subheading: string
  id?: string
  docsUrl: string
  className?: string
  aiPrompts: AIPrompt[]
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

const FrameworkLink = ({ framework, isActive }: { framework: Framework; isActive?: boolean }) => {
  const isXs = useBreakpoint(640)
  return (
    <Link
      href={framework.docs}
      className={cn(
        'group relative p-4 transition-colors duration-200',
        'hover:bg-surface-100 -m-px',
        'flex flex-col items-center gap-2 text-center aspect-square justify-center',
        isActive && 'border-brand bg-surface-100 ring-1 ring-brand/20'
      )}
    >
      <div className="text-foreground-lighter group-hover:text-foreground transition-colors">
        <svg
          width={isXs ? 35 : 45}
          height={isXs ? 35 : 45}
          fillRule="evenodd"
          clipRule="evenodd"
          viewBox="0 0 61 61"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d={framework.icon} fill="currentColor" />
        </svg>
      </div>
      <span className="sr-only text-sm font-medium text-foreground-light group-hover:text-foreground transition-colors">
        {framework.name}
      </span>
    </Link>
  )
}

const PlatformStarterSection = ({
  heading,
  docsUrl,
  id,
  className,
  aiPrompts,
}: PlatformStarterSectionProps) => {
  return (
    <SectionContainer id={id} className={cn('py-16 md:py-24', className)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        <div className="space-y-6 lg:pr-10">
          <h2 className="h2 text-foreground-lighter">{heading}</h2>

          <div className="grid grid-cols-5 divide-x divide-y rounded-lg overflow-hidden border">
            {frameworks.map((framework) => (
              <FrameworkLink key={framework.name} framework={framework} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4 max-w-sm">
            <h2 className="h2 text-foreground-lighter">
              Or, start with <span className="text-foreground">Supabase AI Prompts</span>{' '}
              <Sparkles size={24} className="inline text-foreground" />
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-2">
            {aiPrompts.slice(0, 4).map((prompt) => (
              <CodeSnippet key={prompt.id} prompt={prompt} />
            ))}
          </div>

          <div className="pt-2">
            <TextLink url={docsUrl} label="View all prompts" />
          </div>
        </div>
      </div>
    </SectionContainer>
  )
}

export default PlatformStarterSection

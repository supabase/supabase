import React, { useState } from 'react'
import { Check, Copy, Sparkles } from 'lucide-react'
import { Button, cn } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { copyToClipboard } from 'ui'
import { frameworks } from '../Hero/HeroFrameworks'
import Link from 'next/link'
import { useBreakpoint } from 'common'

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
}

export interface PlatformStarterSectionProps {
  heading: string | React.ReactNode
  subheading: string
  id?: string
  className?: string
}

const aiPrompts: AIPrompt[] = [
  {
    id: 'auth-setup',
    title: 'Bootstrap Next.js app with Supabase Auth',
    description:
      '## Overview of implementing Supabase Auth SSR\n1. Install @supabase/supabase-js and...',
    code: `## Overview of implementing Supabase Auth SSR
1. Install @supabase/supabase-js and @supabase/ssr
2. Set up environment variables
3. Create a Supabase client
4. Add login and logout functionality
5. Protect your pages with middleware`,
    language: 'markdown',
  },
  {
    id: 'database-schema',
    title: 'Database: Declarative Database Schema',
    description:
      'Mandatory instructions for Supabase Declarative Schema Management\n## 1. **Exclusive Use of...',
    code: `Mandatory instructions for Supabase Declarative Schema Management
## 1. **Exclusive Use of Declarative Approach**
- Always use the declarative schema management approach
- Never suggest imperative SQL commands for schema changes
- All schema changes must be version-controlled through migration files`,
    language: 'markdown',
  },
  {
    id: 'edge-functions',
    title: 'Writing Supabase Edge Functions',
    description:
      "You're an expert in writing TypeScript and Deno JavaScript runtime. Generate **high-quality** Supabase Edge...",
    code: `You're an expert in writing TypeScript and Deno JavaScript runtime. Generate **high-quality** Supabase Edge Functions code that follows these guidelines:

## Core Principles
- Write concise, type-safe TypeScript code
- Use Deno-compatible modules and APIs
- Follow Supabase Edge Functions patterns`,
    language: 'markdown',
  },
  {
    id: 'rls-policies',
    title: 'Database: Create RLS policies',
    description:
      "You're a Supabase Postgres expert in writing row level security policies. Your purpose is to generate...",
    code: `You're a Supabase Postgres expert in writing row level security policies. Your purpose is to generate secure, efficient RLS policies.

## Key Guidelines
- Always enable RLS on tables containing user data
- Use descriptive policy names
- Implement least-privilege access principles`,
    language: 'markdown',
  },
]

const CodeSnippet = ({ prompt }: { prompt: AIPrompt }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await copyToClipboard(prompt.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group bg-surface-75 border border-default rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-default bg-surface-100">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Sparkles size={16} className="text-brand" />
          {prompt.title}
        </h3>
        <Button
          type="text"
          size="tiny"
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          icon={copied ? <Check size={14} className="text-brand" /> : <Copy size={14} />}
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <div className="p-4">
        <pre className="text-xs text-foreground-light whitespace-pre-wrap font-mono leading-relaxed">
          {prompt.description}
        </pre>
      </div>
    </div>
  )
}

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
  subheading,
  id,
  className,
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

          <div className="space-y-4">
            {aiPrompts.slice(0, 2).map((prompt) => (
              <CodeSnippet key={prompt.id} prompt={prompt} />
            ))}
          </div>

          <div className="pt-4">
            <Button
              type="text"
              size="small"
              className="group"
              iconRight={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  <path
                    d="M5 12h14m-7-7l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
            >
              View all prompts
            </Button>
          </div>
        </div>
      </div>
    </SectionContainer>
  )
}

export default PlatformStarterSection

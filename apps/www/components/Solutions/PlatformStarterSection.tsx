import React, { useState } from 'react'
import { Check, Copy, Sparkles } from 'lucide-react'
import { Button, cn } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { copyToClipboard } from 'ui'

interface Platform {
  id: string
  name: string
  icon: React.ReactNode
  color?: string
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

const platforms: Platform[] = [
  {
    id: 'react',
    name: 'React',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <g clipPath="url(#clip0)">
          <path
            d="M12 13.5C12.8284 13.5 13.5 12.8284 13.5 12C13.5 11.1716 12.8284 10.5 12 10.5C11.1716 10.5 10.5 11.1716 10.5 12C10.5 12.8284 11.1716 13.5 12 13.5Z"
            fill="currentColor"
          />
          <path
            d="M12 1C18.09 2.56 22 6.84 22 12C22 17.16 18.09 21.44 12 23C5.91 21.44 2 17.16 2 12C2 6.84 5.91 2.56 12 1ZM12 3.1C7.14 4.3 4 7.58 4 12C4 16.42 7.14 19.7 12 20.9C16.86 19.7 20 16.42 20 12C20 7.58 16.86 4.3 12 3.1Z"
            fill="currentColor"
          />
        </g>
        <defs>
          <clipPath id="clip0">
            <rect width="24" height="24" fill="white" />
          </clipPath>
        </defs>
      </svg>
    ),
    color: '#61dafb',
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
      </svg>
    ),
  },
  {
    id: 'nuxt',
    name: 'Nuxt',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.146.146a.5.5 0 0 1 .708 0l11 11a.5.5 0 0 1 0 .708l-11 11a.5.5 0 0 1-.708 0l-11-11a.5.5 0 0 1 0-.708l11-11zM12 2.207L2.207 12 12 21.793 21.793 12 12 2.207z" />
      </svg>
    ),
    color: '#00dc82',
  },
  {
    id: 'angular',
    name: 'Angular',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zM5 8.5l7-3.89L19 8.5v7L12 19.39 5 15.5v-7z" />
      </svg>
    ),
    color: '#dd0031',
  },
  {
    id: 'vue',
    name: 'Vue',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2 3l10 17L22 3h-4l-6 10L6 3H2z" />
      </svg>
    ),
    color: '#4fc08d',
  },
  {
    id: 'svelte',
    name: 'Svelte',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    ),
    color: '#ff3e00',
  },
  {
    id: 'flutter',
    name: 'Flutter',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    ),
    color: '#02569b',
  },
  {
    id: 'kotlin',
    name: 'Kotlin',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    ),
    color: '#7f52ff',
  },
]

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

const PlatformButton = ({
  platform,
  isActive,
  onClick,
}: {
  platform: Platform
  isActive?: boolean
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className={cn(
      'group relative p-4 rounded-lg border border-default transition-all duration-200',
      'hover:border-stronger hover:bg-surface-100',
      'flex flex-col items-center gap-2 text-center min-h-[100px] justify-center',
      isActive && 'border-brand bg-surface-100 ring-1 ring-brand/20'
    )}
  >
    <div className="text-foreground-light group-hover:text-foreground transition-colors">
      {platform.icon}
    </div>
    <span className="text-sm font-medium text-foreground-light group-hover:text-foreground transition-colors">
      {platform.name}
    </span>
  </button>
)

const PlatformStarterSection = ({
  heading,
  subheading,
  id,
  className,
}: PlatformStarterSectionProps) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)

  return (
    <SectionContainer id={id} className={cn('py-16 md:py-24', className)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        <div className="space-y-6">
          <h2 className="h2 text-foreground-lighter">{heading}</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {platforms.map((platform) => (
              <PlatformButton
                key={platform.id}
                platform={platform}
                isActive={selectedPlatform === platform.id}
                onClick={() =>
                  setSelectedPlatform(selectedPlatform === platform.id ? null : platform.id)
                }
              />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl text-foreground-lighter font-normal">
              Or, start with <span className="text-brand">Supabase AI Prompts</span>{' '}
              <Sparkles size={24} className="inline text-brand" />
            </h2>
          </div>

          <div className="space-y-4">
            {aiPrompts.slice(0, 2).map((prompt) => (
              <CodeSnippet key={prompt.id} prompt={prompt} />
            ))}
          </div>

          <div className="pt-4">
            <Button
              type="default"
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

'use client'

import Examples from 'data/Examples'
import Link from 'next/link'
import { Button, IconGitHubSolid } from 'ui'

const FRAMEWORK_TAGS: Record<string, string> = {
  'Next.js': '/images/logos/frameworks/nextjs.svg',
  React: '/images/logos/frameworks/react.svg',
  Svelte: '/images/logos/frameworks/svelte.svg',
  Flutter: '/images/logos/frameworks/flutter.svg',
  Expo: '/images/logos/frameworks/expo.svg',
  NestJs: '/images/logos/frameworks/nestjs.svg',
  Stripe: '/images/logos/frameworks/stripe.svg',
  Vercel: '/images/logos/frameworks/vercel.svg',
  OpenAI: '/images/logos/frameworks/openai.svg',
  LangChain: '/images/logos/frameworks/langchain.svg',
}

export function BuiltWithSupabaseSection() {
  const featuredExamples = Examples.slice(0, 2)
  const gridExamples = Examples.slice(2, 6)

  return (
    <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6 border-x border-border py-16 md:py-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h3 className="h2">Start building in seconds</h3>
          <p className="p max-w-[300px] md:max-w-none !mb-0">
            Kickstart your next project with templates built by us and our community.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild type="default" size="small">
            <Link href="/docs/guides/examples">View all examples</Link>
          </Button>
          <Button
            asChild
            type="default"
            icon={<IconGitHubSolid size="tiny" className="!w-full !h-full" />}
            size="small"
          >
            <Link href="https://github.com/supabase/supabase/tree/master/examples">
              Official GitHub library
            </Link>
          </Button>
        </div>
      </div>

      {/* Featured cards - 2 large */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {featuredExamples.map((example) => (
          <Link
            key={example.title}
            href={example.repo_url ?? '#'}
            target="_blank"
            className="group rounded-lg border border-border bg-surface-75 overflow-hidden hover:border-foreground-muted transition-colors"
          >
            <div className="aspect-[16/9] bg-surface-200 flex items-center justify-center gap-6 overflow-hidden">
              {example.tags.map((tag) => {
                const icon = FRAMEWORK_TAGS[tag]
                return icon ? (
                  <img
                    key={tag}
                    src={icon}
                    alt={tag}
                    className="h-8 w-auto opacity-40 grayscale group-hover:opacity-60 transition-opacity"
                  />
                ) : (
                  <span key={tag} className="text-foreground-lighter text-sm font-medium">
                    {tag}
                  </span>
                )
              })}
            </div>
            <div className="p-5">
              <h4 className="text-foreground text-base font-medium">{example.title}</h4>
              <p className="text-foreground-lighter text-sm mt-1 line-clamp-2">
                {example.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Smaller cards - 2x2 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {gridExamples.map((example) => (
          <Link
            key={example.title}
            href={example.repo_url ?? '#'}
            target="_blank"
            className="group flex items-center justify-between gap-4 rounded-lg border border-border bg-surface-75 p-5 hover:border-foreground-muted transition-colors"
          >
            <div className="min-w-0">
              <h4 className="text-foreground text-sm font-medium">{example.title}</h4>
              <p className="text-foreground-lighter text-xs mt-1 line-clamp-1">
                {example.description}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {example.tags.map((tag) => {
                const icon = FRAMEWORK_TAGS[tag]
                return icon ? (
                  <img key={tag} src={icon} alt={tag} className="h-4 w-auto opacity-40 grayscale" />
                ) : (
                  <span
                    key={tag}
                    className="text-foreground-lighter text-[10px] bg-surface-200 px-1.5 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                )
              })}
            </div>
          </Link>
        ))}
      </div>

      {/* View more link */}
      <div className="text-center">
        <Link
          href="/docs/guides/examples"
          className="text-foreground-lighter hover:text-foreground text-sm transition-colors"
        >
          View more examples &rarr;
        </Link>
      </div>
    </div>
  )
}

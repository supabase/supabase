import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ArrowLeft, ArrowUpRight, Globe, Rocket } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'
import { GithubIcon } from 'ui'

import { DeployInstructions } from '@/components/DeployInstructions'
import { ExampleCard } from '@/components/ExampleCard'
import { FeatureBadge } from '@/components/FeatureBadge'
import { PreviewFrame } from '@/components/PreviewFrame'
import { PromptPanel } from '@/components/PromptPanel'
import { getExample, getRelatedExamples } from '@/data/registry'
import { EXAMPLE_CATEGORIES } from '@/data/types'
import { withBasePath } from '@/lib/base-path'

export const Route = createFileRoute('/_site/$slug')({
  loader: ({ params }) => {
    const example = getExample(params.slug)
    if (!example) throw notFound()
    return { example }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.example.title} · Supabase Templates` },
          { name: 'description', content: loaderData.example.tagline },
        ]
      : [],
  }),
  component: ExamplePage,
})

const dateFormat = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

function ExamplePage() {
  const { example } = Route.useLoaderData()
  const related = getRelatedExamples(example)

  return (
    <main className="section-container py-8">
      <Link
        to="/"
        search={{ q: '', features: [] }}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-foreground-light hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All examples
      </Link>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-16">
          <div className="h-[72vh] min-h-[520px]">
            <PreviewFrame
              title={example.title}
              embedUrl={withBasePath(example.embedUrl ?? example.demoUrl)}
              demoUrl={withBasePath(example.demoUrl)}
            />
          </div>
          <DeployInstructions deploy={example.deploy} />
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:max-h-[calc(100dvh-var(--header-height)-3rem)] lg:self-start lg:overflow-y-auto">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl leading-tight tracking-title">{example.title}</h1>
            <p className="text-foreground-light">{example.tagline}</p>
          </div>

          <PromptPanel key={example.slug} example={example} />

          <nav aria-label="Template links" className="flex flex-col divide-y rounded-lg border">
            <ResourceLink href={example.repoUrl} icon={GithubIcon}>
              Source code
            </ResourceLink>
            <ResourceLink href={withBasePath(example.demoUrl)} icon={Globe}>
              Live demo
            </ResourceLink>
            {example.deploy.deployUrl && (
              <ResourceLink href={example.deploy.deployUrl} icon={Rocket}>
                Deploy to Vercel
              </ResourceLink>
            )}
          </nav>

          <div className="flex flex-col gap-3 text-sm text-foreground-light">
            {example.description.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <dl className="grid grid-cols-[6rem_1fr] gap-x-4 gap-y-3 border-t pt-5 text-sm">
            <Detail label="Products">
              <div className="flex flex-wrap gap-1.5">
                {example.features.map((feature) => (
                  <FeatureBadge key={feature} feature={feature} />
                ))}
              </div>
            </Detail>
            <Detail label="Stack">{example.stack.join(', ')}</Detail>
            <Detail label="Category">{EXAMPLE_CATEGORIES[example.category]}</Detail>
            <Detail label="Updated">{dateFormat.format(new Date(example.updatedAt))}</Detail>
          </dl>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-24 border-t pt-12" aria-labelledby="related-heading">
          <h2 id="related-heading" className="mb-8 text-2xl font-medium">
            More examples like this
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ExampleCard key={item.slug} example={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

function ResourceLink({
  href,
  icon: Icon,
  children,
}: {
  href: string
  icon: ComponentType<{ className?: string }>
  children: ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-3 px-3 py-2.5 text-sm text-foreground-light transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-surface-100 hover:text-foreground"
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1">{children}</span>
      <ArrowUpRight className="size-4 text-foreground-muted transition-transform motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5" />
    </a>
  )
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="pt-0.5 text-foreground-lighter">{label}</dt>
      <dd className="text-foreground-light">{children}</dd>
    </>
  )
}

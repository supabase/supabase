import Examples from 'data/Examples'
import Link from 'next/link'
import { cn } from 'ui'

const EXAMPLE_LOGO: Record<string, { src: string; invert?: boolean }> = {
  'Stripe Subscriptions Starter': { src: '/images/logos/frameworks/stripe.svg' },
  'Next.js Starter': { src: '/images/logos/frameworks/nextjs.svg', invert: true },
  'AI Chatbot': { src: '/images/logos/frameworks/openai.svg', invert: true },
  'LangChain + Next.js Starter': { src: '/images/logos/frameworks/langchain.svg' },
  'Flutter User Management': { src: '/images/logos/frameworks/flutter.svg' },
  'Expo React Native Starter': { src: '/images/logos/frameworks/expo.svg', invert: true },
}

function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn(`rounded bg-foreground-muted/10`, className)} />
}

function StripeSkeleton() {
  return (
    <div
      aria-label="Pricing page with subscription tiers"
      className="flex flex-col items-center justify-center gap-3 p-5 w-full"
    >
      <div className="flex -mb-8">
        <div className="w-24 aspect-[9/16] border flex flex-col items-center">
          <div className="flex flex-col items-center justify-center gap-2 p-2">
            <SkeletonBar className="w-8 h-2.5" />
            <SkeletonBar className="w-16 h-2.5" />
          </div>

          <SkeletonBar className="w-20 aspect-square mt-4" />
        </div>

        <div className="w-24 aspect-[9/16] border flex flex-col items-center border-l-0 bg-[#635BFF]/5">
          <div className="flex flex-col items-center justify-center gap-2 p-2">
            <SkeletonBar className="w-8 h-2.5 bg-purple-800" />
            <SkeletonBar className="w-16 h-2.5 bg-purple-900" />
          </div>

          <SkeletonBar className="w-20 aspect-square mt-4 dark:bg-muted" />
        </div>

        <div className="w-24 aspect-[9/16] border flex flex-col items-center border-l-0">
          <div className="flex flex-col items-center justify-center gap-2 p-2">
            <SkeletonBar className="w-8 h-2.5" />
            <SkeletonBar className="w-16 h-2.5" />
          </div>

          <SkeletonBar className="w-20 aspect-square mt-4" />
        </div>
      </div>
    </div>
  )
}

function NextjsSkeleton() {
  return (
    <div
      aria-label="Dashboard with sidebar navigation and data grid"
      className="flex w-full h-full"
    >
      {/* Sidebar */}
      <div className="w-24 border-r border-foreground-muted/10 flex flex-col gap-2 p-3 pt-3">
        <SkeletonBar className="h-3 w-3 rounded-sm bg-[#0070F3]" />
        <div className="flex flex-col gap-1.5 mt-3">
          <SkeletonBar className="h-2 w-full bg-muted" />
          <SkeletonBar className="h-2 w-14" />
          <SkeletonBar className="h-2 w-full" />
          <SkeletonBar className="h-2 w-10" />
        </div>
      </div>
      {/* Main */}
      <div className="flex-1 flex flex-col gap-2 p-3">
        <SkeletonBar className="h-2.5 w-16 bg-muted" />
        {/* 3x4 data grid */}
        <div className="grid grid-cols-4 grid-rows-3 gap-1.5 flex-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'rounded-sm bg-foreground-muted/10 min-h-[40px]',
                [1, 6, 9].includes(i) && 'bg-muted/70'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

const SKELETON_CONTENT: Record<string, () => React.JSX.Element> = {
  'Stripe Subscriptions Starter': StripeSkeleton,
  'Next.js Starter': NextjsSkeleton,
}

export function BuiltWithSupabaseSection() {
  const featuredExamples = Examples.slice(0, 2)
  const gridExamples = Examples.slice(2, 6)

  return (
    <div className="py-24 flex flex-col gap-16">
      {/* Header row */}
      <div className="mx-auto max-w-[var(--container-max-w,75rem)] w-full px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h3 className="text-2xl md:text-4xl text-foreground-lighter max-w-xl">
            Kickstart your next project <br />
            <span className="text-foreground">with production ready templates</span>
          </h3>
          <Link
            href="/docs/guides/examples"
            className="text-sm text-foreground-light hover:text-foreground underline"
          >
            View all examples
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6 w-full">
        {/* Featured row - 2 large cells */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {featuredExamples.map((example) => {
            const logo = EXAMPLE_LOGO[example.title]
            const Skeleton = SKELETON_CONTENT[example.title]
            return (
              <Link
                key={example.title}
                href={example.repo_url ?? '#'}
                target="_blank"
                className="group flex flex-col bg-surface-75 border border-border rounded-lg overflow-hidden hover:bg-surface-100 transition-colors"
              >
                <div className="px-6 py-5 flex flex-col gap-2.5">
                  {logo && (
                    <img
                      src={logo.src}
                      alt=""
                      className={`h-5 w-fit object-contain ${logo.invert ? ' dark:invert' : ''}`}
                    />
                  )}
                  <div>
                    <h4 className="text-foreground text-sm font-medium">{example.title}</h4>
                    <p className="text-foreground-lighter text-sm mt-1 line-clamp-2">
                      {example.description}
                    </p>
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center px-6 pt-4 pb-0 overflow-hidden">
                  {/* Browser frame */}
                  <div className="w-full rounded-t-lg border border-b-0 border-border-stronger/50 shadow-lg -mb-[10%] overflow-hidden">
                    {/* Title bar */}
                    <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-border bg-background-200">
                      <span className="size-2.5 rounded-full bg-foreground-muted/30" />
                      <span className="size-2.5 rounded-full bg-foreground-muted/30" />
                      <span className="size-2.5 rounded-full bg-foreground-muted/30" />
                    </div>
                    {/* Skeleton content */}
                    <div className="h-[240px] flex items-center justify-center bg-background">
                      {Skeleton ? <Skeleton /> : null}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Grid row - 4 smaller cells */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          {gridExamples.map((example) => {
            const logo = EXAMPLE_LOGO[example.title]
            return (
              <Link
                key={example.title}
                href={example.repo_url ?? '#'}
                target="_blank"
                className="group flex flex-col bg-surface-75 border border-border rounded-lg px-6 py-10 hover:bg-surface-100 transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  {logo && (
                    <img
                      src={logo.src}
                      alt=""
                      className={`h-5 w-5 object-contain${logo.invert ? ' dark:invert' : ''}`}
                    />
                  )}
                </div>
                <h4 className="text-foreground text-sm font-medium">{example.title}</h4>
                <p className="text-foreground-lighter text-sm mt-1 line-clamp-2">
                  {example.description}
                </p>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

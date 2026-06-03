import Examples from 'data/Examples'
import Link from 'next/link'
import { PRODUCT_NAMES } from 'shared-data/products'

const EXAMPLE_ICON: Record<string, { src: string; invert?: boolean; className?: string }> = {
  Resend: { src: '/images/logos/resend-wordmark.svg', invert: true, className: 'h-4 w-auto' },
  OpenAI: { src: '/images/logos/frameworks/openai.svg', invert: true, className: 'h-5 w-5' },
  Stripe: { src: '/images/logos/frameworks/stripe.svg', className: 'h-7 w-auto' },
  Postgres: { src: '/images/product/database/postgresql-icon.svg', className: 'h-5 w-5' },
  Huggingface: { src: '/images/logos/hugging-face-icon.svg', className: 'h-5 w-5' },
  Supabase: { src: '/images/supabase-logo-icon.svg', className: 'h-5 w-5' },
}

export function ExamplesSection() {
  const examples = Examples.filter((example) => example.products.includes(PRODUCT_NAMES.FUNCTIONS))
  const featuredExamples = examples.slice(0, 2)
  const gridExamples = examples.slice(2, 6)

  return (
    <div className="py-24 flex flex-col gap-16">
      {/* Header */}
      <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6 w-full">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h3 className="text-2xl md:text-4xl text-foreground-lighter max-w-xl">
            What you can build <br />
            <span className="text-foreground">with Edge Functions</span>
          </h3>
          <Link
            href="/docs/guides/functions#examples"
            className="text-sm text-foreground-light hover:text-foreground underline"
          >
            View all examples
          </Link>
        </div>
      </div>

      {/* Cards */}
      <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6 w-full">
        {/* Featured row - 2 large cells */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {featuredExamples.map((example) => {
            const tag = example.tags?.[0]
            const icon = tag ? EXAMPLE_ICON[tag] : undefined
            return (
              <Link
                key={example.title}
                href={example.repo_url ?? '#'}
                target="_blank"
                className="group flex flex-col bg-surface-75 border border-border rounded-lg px-6 py-8 "
              >
                <div className="flex items-center gap-2 mb-4">
                  {icon && (
                    <img
                      src={icon.src}
                      alt=""
                      className={`${icon.className} object-contain${icon.invert ? ' dark:invert' : ''}`}
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

        {/* Grid row - 4 smaller cells */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          {gridExamples.map((example) => {
            const tag = example.tags?.[0]
            const icon = tag ? EXAMPLE_ICON[tag] : undefined
            return (
              <Link
                key={example.title}
                href={example.repo_url ?? '#'}
                target="_blank"
                className="group flex flex-col bg-surface-75 border border-border rounded-lg px-6 py-10 "
              >
                <div className="flex items-center gap-2 mb-4">
                  {icon && (
                    <img
                      src={icon.src}
                      alt=""
                      className={`${icon.className} object-contain${icon.invert ? ' dark:invert' : ''}`}
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

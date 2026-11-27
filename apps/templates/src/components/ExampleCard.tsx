import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

import { FeatureIcon } from './FeatureBadge'
import { SUPABASE_FEATURES, type Example } from '@/data/types'
import { withBasePath } from '@/lib/base-path'

const MAX_FEATURES = 3

/**
 * Screenshots of the live demo, captured by `pnpm screenshots`. Both are in the
 * page; CSS shows the one that matches the current theme.
 */
function DemoScreenshot({ example }: { example: Example }) {
  const imageClassName = 'size-full object-cover object-top'
  return (
    <>
      <img
        src={withBasePath(`/screenshots/${example.slug}-light.jpg`)}
        alt={`${example.title} demo`}
        width={800}
        height={500}
        loading="lazy"
        decoding="async"
        className={`${imageClassName} dark:hidden`}
      />
      <img
        src={withBasePath(`/screenshots/${example.slug}-dark.jpg`)}
        alt=""
        width={800}
        height={500}
        loading="lazy"
        decoding="async"
        className={`${imageClassName} hidden dark:block`}
      />
    </>
  )
}

export function ExampleCard({ example }: { example: Example }) {
  const shownFeatures = example.features.slice(0, MAX_FEATURES)
  const hiddenCount = example.features.length - shownFeatures.length

  return (
    <Link
      to="/$slug"
      params={{ slug: example.slug }}
      className="group flex flex-col overflow-hidden rounded-lg border bg-background transition-colors duration-200 hover:border-strong focus-ring"
    >
      {/* The demo peeks up from the bottom of the frame, like a window. */}
      <div className="aspect-[16/10] overflow-hidden border-b bg-surface-75 px-6 pt-6">
        <div className="h-full overflow-hidden rounded-t-md border border-b-0 shadow-sm transition-transform duration-500 ease-out group-hover:-translate-y-1">
          <DemoScreenshot example={example} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-2xl tracking-tight">{example.title}</h3>
          <ArrowRight className="size-4 shrink-0 -translate-x-1 text-foreground-lighter opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
        </div>
        <p className="line-clamp-2 text-sm text-foreground-light">{example.tagline}</p>
        <ul className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-4 text-xs text-foreground-lighter">
          {shownFeatures.map((feature) => (
            <li key={feature} className="flex items-center gap-1.5">
              <FeatureIcon feature={feature} className="size-3.5" />
              {SUPABASE_FEATURES[feature].label}
            </li>
          ))}
          {hiddenCount > 0 && <li>+{hiddenCount}</li>}
        </ul>
      </div>
    </Link>
  )
}

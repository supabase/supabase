'use client'

import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import { cn } from 'ui'

const FEATURES = [
  {
    title: 'Interoperable',
    description: 'Integrates with the rest of Supabase — Auth and Postgres work together.',
    visual: InteroperableSkeleton,
  },
  {
    title: 'Lightning fast',
    description:
      'Thin API server layer built on Postgres permissions with content delivered via global CDN.',
    visual: CDNSkeleton,
  },
  {
    title: 'Multiple bucket types',
    description:
      'Files, Analytics, or Vector buckets — choose the right storage model for your application.',
    visual: BucketsSkeleton,
  },
]

function InteroperableSkeleton() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden [mask-image:radial-gradient(ellipse_88%_88%_at_50%_50%,black_40%,transparent_80%)] [webkit-mask-image:radial-gradient(ellipse_88%_88%_at_50%_50%,black_40%,transparent_80%)]">
      <div className="relative h-[220px] w-[310px]">
        <div className="pointer-events-none absolute inset-0 text-foreground-muted/12">
          <line x1="155" y1="8" x2="155" y2="212" className="stroke-current" strokeWidth="1" />
          <line x1="60" y1="8" x2="60" y2="212" className="stroke-current" strokeWidth="1" />
          <line x1="250" y1="8" x2="250" y2="212" className="stroke-current" strokeWidth="1" />
          <line x1="8" y1="110" x2="302" y2="110" className="stroke-current" strokeWidth="1" />
        </div>

        <div className="pointer-events-none absolute left-[58px] top-1/2 flex w-[56px] -translate-y-1/2 flex-col gap-1">
          {[0, 1].map((i) => (
            <div
              key={`left-conn-${i}`}
              className="relative h-[1.5px] w-full overflow-hidden bg-brand/18 [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)] [webkit-mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]"
            >
              <div
                className="absolute inset-y-0 left-0 w-24 [animation:interopLineSweep_1.05s_linear_infinite]"
                style={{
                  animationDelay: `${i * 100}ms`,
                  background:
                    'linear-gradient(to right, hsl(var(--brand-default)/0), hsl(var(--brand-default)/0.95), hsl(var(--brand-default)/0))',
                }}
              />
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute right-[58px] top-1/2 flex w-[56px] -translate-y-1/2 flex-col gap-1">
          {[0, 1].map((i) => (
            <div
              key={`right-conn-${i}`}
              className="relative h-[1.5px] w-full overflow-hidden bg-brand/18 [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)] [webkit-mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]"
            >
              <div
                className="absolute inset-y-0 left-0 w-24 [animation:interopLineSweep_1.05s_linear_infinite]"
                style={{
                  animationDelay: `${140 + i * 100}ms`,
                  background:
                    'linear-gradient(to right, hsl(var(--brand-default)/0), hsl(var(--brand-default)/0.95), hsl(var(--brand-default)/0))',
                }}
              />
            </div>
          ))}
        </div>

        <div className="absolute left-0 top-1/2 flex h-[70px] w-[70px] -translate-y-1/2 items-center justify-center rounded-xl border border-border bg-surface-100/95 shadow-[0_2px_10px_hsl(var(--background-default)/0.15)]">
          <div className="absolute inset-3 rounded-full border border-foreground-muted/15" />
          <div className="absolute inset-5 rounded-full border border-foreground-muted/10" />
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            className="relative z-10 text-foreground-muted"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" className="stroke-current" />
            <circle cx="12" cy="7" r="4" className="stroke-current" />
          </svg>
        </div>

        <div className="absolute left-1/2 top-1/2 flex h-[92px] w-[108px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-border bg-surface-100/95 shadow-[0_6px_18px_hsl(var(--background-default)/0.16)]">
          <div className="absolute inset-3 rounded-[14px] border border-foreground-muted/10" />
          <div className="absolute size-12 rounded-full border border-foreground-muted/15" />
          <div className="absolute size-16 rounded-full border border-foreground-muted/8" />
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            className="relative z-10 text-brand"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path
              d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
              className="stroke-current"
            />
          </svg>
        </div>

        <div className="absolute right-0 top-1/2 flex h-[70px] w-[70px] -translate-y-1/2 items-center justify-center rounded-xl border border-border bg-surface-100/95 shadow-[0_2px_10px_hsl(var(--background-default)/0.15)]">
          <div className="absolute inset-3 rounded-full border border-foreground-muted/15" />
          <div className="absolute inset-5 rounded-full border border-foreground-muted/10" />
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            className="relative z-10 text-foreground-muted"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <ellipse cx="12" cy="5" rx="7" ry="3" className="stroke-current" />
            <path d="M19 12c0 1.66-3.13 3-7 3s-7-1.34-7-3" className="stroke-current" />
            <path d="M5 5v14c0 1.66 3.13 3 7 3s7-1.34 7-3V5" className="stroke-current" />
          </svg>
        </div>

        <style>{`
          @keyframes interopLineSweep {
            from {
              transform: translateX(-120%);
            }
            to {
              transform: translateX(260%);
            }
          }
        `}</style>
      </div>
    </div>
  )
}

function CDNSkeleton() {
  return (
    <div className="relative flex h-full w-full items-center justify-center [mask-image:radial-gradient(ellipse_85%_85%_at_50%_50%,black_35%,transparent_78%)] [webkit-mask-image:radial-gradient(ellipse_85%_85%_at_50%_50%,black_35%,transparent_78%)]">
      <div className="absolute inset-0 z-[1] flex items-center justify-center">
        <div className="flex w-[290px] flex-col gap-0.5">
          {[-20, -10, 0, 10, 20].map((offset, i) => (
            <div
              key={`flash-${offset}`}
              className="relative h-px w-full overflow-hidden bg-brand/15 [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)] [webkit-mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]"
              style={{ transform: `translateY(${offset}px)` }}
            >
              <div
                className="absolute inset-y-0 left-0 w-24 [animation:cdnFlashSweep_1.05s_linear_infinite]"
                style={{
                  animationDelay: `${i * 130}ms`,
                  background:
                    'linear-gradient(to right, hsl(var(--brand-default)/0), hsl(var(--brand-default)/0.9), hsl(var(--brand-default)/0))',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2">
          <div className="absolute -left-[70px] top-1/2 h-[88px] w-[122px] -translate-y-1/2 rounded-[20px] border border-border bg-surface-100 shadow-[0_2px_10px_hsl(var(--background-default)/0.18)]" />
          <div className="absolute -right-[70px] top-1/2 h-[88px] w-[122px] -translate-y-1/2 rounded-[20px] border border-border bg-surface-100 shadow-[0_2px_10px_hsl(var(--background-default)/0.18)]" />
        </div>

        <div className="relative flex h-[116px] w-[116px] items-center justify-center rounded-[24px] border border-foreground/15 bg-surface-200/95 shadow-[0_8px_28px_hsl(var(--background-default)/0.24)]">
          <div className="absolute inset-0 rounded-[24px] shadow-[inset_0_1px_0_hsl(var(--foreground-default)/0.06)]" />
          <div className="absolute size-10 rounded-full bg-brand/15 blur-xl" />
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            className="relative z-10 text-brand"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path
              d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
              className="stroke-current"
            />
          </svg>
        </div>
      </div>

      <style>{`
        @keyframes cdnFlashSweep {
          from {
            transform: translateX(-120%);
          }
          to {
            transform: translateX(260%);
          }
        }
      `}</style>
    </div>
  )
}

function BucketsSkeleton() {
  const buckets = [
    {
      name: 'Files',
      label: 'images, videos, docs',
      icon: 'folder' as const,
      colorClass: 'text-brand',
    },
    {
      name: 'Analytics',
      label: 'Iceberg, time-series',
      icon: 'chart' as const,
      colorClass: 'text-blue-700 dark:text-blue-400',
    },
    {
      name: 'Vectors',
      label: 'embeddings, RAG',
      icon: 'sparkles' as const,
      colorClass: 'text-purple-700 dark:text-purple-400',
    },
  ]

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="flex w-64 flex-col gap-2">
        {buckets.map((bucket) => (
          <div
            key={bucket.name}
            className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-border bg-surface-200"
          >
            <div className="flex items-center gap-2">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                className={cn('shrink-0', bucket.colorClass)}
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                {bucket.icon === 'folder' && (
                  <path
                    d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                    className="stroke-current"
                  />
                )}
                {bucket.icon === 'chart' && (
                  <>
                    <line x1="5" y1="20" x2="5" y2="10" className="stroke-current" />
                    <line x1="12" y1="20" x2="12" y2="6" className="stroke-current" />
                    <line x1="19" y1="20" x2="19" y2="13" className="stroke-current" />
                  </>
                )}
                {bucket.icon === 'sparkles' && (
                  <>
                    <path
                      d="M12 3l2.3 5.2L20 10.5l-5.7 2.3L12 18l-2.3-5.2L4 10.5l5.7-2.3L12 3z"
                      className="stroke-current"
                    />
                    <path d="M19 3v4" className="stroke-current" />
                    <path d="M21 5h-4" className="stroke-current" />
                  </>
                )}
              </svg>
              <span className={cn('text-xs font-medium', bucket.colorClass)}>{bucket.name}</span>
            </div>
            <span className="text-foreground-muted text-[11px]">{bucket.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FeaturesSection() {
  return (
    <SectionContainerWithCn spacing="sections">
      {/* Header */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
        <h3 className="text-2xl md:text-4xl text-foreground-lighter max-w-xl">
          Everything you need
          <br />
          <span className="text-foreground">for storage</span>
        </h3>
        <p className="text-foreground-lighter text-sm lg:text-base">
          S3 compatible storage with global CDN, image transformations, and fine-grained access
          controls powered by Postgres RLS.
        </p>
      </div>

      {/* 3-col grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {FEATURES.map((feature) => {
          const Visual = feature.visual
          return (
            <div
              key={feature.title}
              className="flex flex-col bg-surface-75 border border-border rounded-lg overflow-hidden"
            >
              <div className="relative flex items-center justify-center h-[320px]">
                <Visual />
              </div>
              <div className="px-6 py-5 flex flex-col gap-1">
                <h4 className="text-foreground text-sm font-medium">{feature.title}</h4>
                <p className="text-foreground-lighter text-sm">{feature.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </SectionContainerWithCn>
  )
}

import Link from 'next/link'
import { Datadog, Grafana } from 'icons'
import { Flame } from 'lucide-react'
import type { ReactNode } from 'react'

interface MetricsStackOption {
  title: string
  description: ReactNode
  href: string
  icon: ReactNode
  iconColor: string
  iconBg: string
  badges: { label: string; variant: 'default' | 'community' }[]
}

const metricsStackOptions: MetricsStackOption[] = [
  {
    title: 'Grafana Cloud (SaaS)',
    description: (
      <>
        Use Grafana Cloud’s managed Prometheus (works on Free + Pro tiers) and import the Supabase
        dashboard without running any infrastructure.
      </>
    ),
    href: '/guides/telemetry/metrics/grafana-cloud',
    icon: <Grafana className="h-5 w-5" />,
    iconColor: '#F05A28',
    iconBg: 'rgba(240,90,40,0.1)',
    badges: [
      { label: 'Supabase guide', variant: 'default' },
      { label: 'Community', variant: 'community' },
    ],
  },
  {
    title: 'Grafana + self-hosted Prometheus',
    description: (
      <>
        Run Prometheus yourself following the official installation guidance and pair it with
        Grafana plus our dashboard JSON and alert pack.
      </>
    ),
    href: '/guides/telemetry/metrics/grafana-self-hosted',
    icon: <Grafana className="h-5 w-5" />,
    iconColor: '#F05A28',
    iconBg: 'rgba(240,90,40,0.1)',
    badges: [{ label: 'Supabase guide', variant: 'default' }],
  },
  {
    title: 'Datadog',
    description: (
      <>
        Scrape the Metrics API with the Datadog Agent or Prometheus remote write and monitor
        Supabase alongside your app telemetry.
      </>
    ),
    href: 'https://docs.datadoghq.com/integrations/supabase/',
    icon: <Datadog className="h-5 w-5" />,
    iconColor: '#632CA6',
    iconBg: 'rgba(99,44,166,0.1)',
    badges: [{ label: 'Community', variant: 'community' }],
  },
  {
    title: 'Vendor-agnostic / BYO Prometheus',
    description: (
      <>
        Connect AWS AMP, Grafana Mimir, VictoriaMetrics, or any Prometheus-compatible SaaS with the
        same scrape job pattern.
      </>
    ),
    href: '/guides/telemetry/metrics/vendor-agnostic',
    icon: <Flame className="h-5 w-5" strokeWidth={1.5} />,
    iconColor: '#0BA678',
    iconBg: 'rgba(11,166,120,0.1)',
    badges: [{ label: 'Supabase guide', variant: 'default' }],
  },
]

export function MetricsStackCards() {
  return (
    <div className="grid gap-4 not-prose md:grid-cols-2">
      {metricsStackOptions.map((option) => (
        <Link key={option.href} href={option.href} className="col-span-1 block h-full">
          <div className="relative flex h-full flex-col gap-4 rounded-2xl border border-foreground/10 bg-surface-75/50 p-5 text-left transition duration-200 hover:border-foreground/30 hover:bg-surface-100">
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-base font-semibold"
                style={{ color: option.iconColor, backgroundColor: option.iconBg }}
              >
                {option.icon}
              </span>
              <p className="text-base font-medium text-foreground">{option.title}</p>
            </div>
            <div className="text-sm text-foreground-light">{option.description}</div>
            <div className="mt-auto flex flex-wrap gap-2">
              {option.badges.map((badge) => (
                <span
                  key={`${option.href}-${badge.label}`}
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    badge.variant === 'community'
                      ? 'border-warning/40 text-warning'
                      : 'border-brand-500/50 text-brand'
                  }`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

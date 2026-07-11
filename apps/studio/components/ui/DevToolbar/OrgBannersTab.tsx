'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { cn } from 'ui'

import { PricingMetric } from '@/data/analytics/org-daily-stats-query'
import { usageKeys } from '@/data/usage/keys'
import type { OrgMetricsUsage, OrgUsageData } from '@/data/usage/org-usage-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

const LOGS_METRICS = [
  { metric: PricingMetric.LOG_INGESTION, label: 'Log Ingestion' },
  { metric: PricingMetric.LOG_QUERYING, label: 'Log Query' },
] as const

type LogsMetric = (typeof LOGS_METRICS)[number]['metric']
type ExceededState = Record<LogsMetric, boolean>

const INITIAL_STATE: ExceededState = {
  [PricingMetric.LOG_INGESTION]: false,
  [PricingMetric.LOG_QUERYING]: false,
}

/**
 * Build a usage entry that trips the exceeded-quota predicate in
 * useOrganizationRestrictions (capped, not unlimited, usage over free units).
 */
const makeExceededMetric = (metric: LogsMetric): OrgMetricsUsage => ({
  metric,
  usage: 100,
  usage_original: 100,
  cost: 0,
  unit_price_desc: 'Mocked via DevToolbar',
  available_in_plan: true,
  unlimited: false,
  capped: true,
  pricing_free_units: 1,
  pricing_strategy: 'UNIT',
  project_allocations: [],
})

export const OrgBannersTab = () => {
  const queryClient = useQueryClient()
  const { data: selectedOrg, isLoading: isOrgLoading } = useSelectedOrganizationQuery()
  const orgSlug = selectedOrg?.slug
  const [exceeded, setExceeded] = useState<ExceededState>(INITIAL_STATE)

  // Track the latest slug so the unmount cleanup invalidates the correct cache
  // key even when the slug was still loading at mount time.
  const latestSlug = useRef(orgSlug)
  useEffect(() => {
    latestSlug.current = orgSlug
  })

  // Only invalidate on unmount if overrides were actually applied, to avoid
  // unnecessary refetches when the toolbar is opened but this tab is unused.
  const hasOverridesRef = useRef(false)

  // Revert to real usage data when the toolbar sheet closes (unmounts this tab).
  useEffect(() => {
    return () => {
      if (!hasOverridesRef.current || !latestSlug.current) return
      queryClient.invalidateQueries({ queryKey: usageKeys.orgUsage(latestSlug.current) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyOverrides = (next: ExceededState) => {
    if (!orgSlug) return
    const current = queryClient.getQueryData<OrgUsageData>(usageKeys.orgUsage(orgSlug))
    const baseUsages = (current?.usages ?? []).filter(
      (metric) =>
        metric.metric !== PricingMetric.LOG_INGESTION &&
        metric.metric !== PricingMetric.LOG_QUERYING
    )
    const mockedUsages = LOGS_METRICS.filter(({ metric }) => next[metric]).map(({ metric }) =>
      makeExceededMetric(metric)
    )
    queryClient.setQueryData<OrgUsageData>(usageKeys.orgUsage(orgSlug), {
      usage_billing_enabled: current?.usage_billing_enabled ?? true,
      usages: [...baseUsages, ...mockedUsages],
    })
    hasOverridesRef.current = true
  }

  const handleToggle = (metric: LogsMetric, value: boolean) => {
    const next = { ...exceeded, [metric]: value }
    setExceeded(next)
    applyOverrides(next)
  }

  const handleReset = () => {
    setExceeded(INITIAL_STATE)
    hasOverridesRef.current = false
    if (orgSlug) {
      queryClient.invalidateQueries({ queryKey: usageKeys.orgUsage(orgSlug) })
    }
  }

  const isDisabled = isOrgLoading || !orgSlug

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-foreground-light">
          Override the logs quota banner for the current organization.
        </p>
        <button
          onClick={handleReset}
          disabled={isDisabled}
          className="text-xs text-foreground-lighter hover:text-foreground transition underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset to real data
        </button>
      </div>

      {isDisabled && <p className="text-xs text-foreground-muted">Loading org context...</p>}

      <div className={cn('space-y-3', isDisabled && 'opacity-50 pointer-events-none')}>
        {LOGS_METRICS.map(({ metric, label }) => (
          <div key={metric} className="flex items-center justify-between">
            <span className="text-sm text-foreground-light">{label} quota exceeded</span>
            <div className="flex gap-1">
              <ToggleButton active={!exceeded[metric]} onClick={() => handleToggle(metric, false)}>
                Off
              </ToggleButton>
              <ToggleButton
                active={exceeded[metric]}
                variant="warning"
                onClick={() => handleToggle(metric, true)}
              >
                Exceeded
              </ToggleButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ToggleButtonProps {
  active: boolean
  variant?: 'off' | 'warning'
  onClick: () => void
  children: React.ReactNode
}

const ToggleButton = ({ active, variant = 'off', onClick, children }: ToggleButtonProps) => (
  <button
    onClick={onClick}
    className={cn(
      'px-1.5 py-0.5 rounded-sm text-xs font-mono transition border',
      active
        ? variant === 'off'
          ? 'bg-surface-300 text-foreground border-strong'
          : 'bg-warning/20 text-warning border-warning'
        : 'bg-transparent text-foreground-muted border-transparent hover:border-border'
    )}
  >
    {children}
  </button>
)

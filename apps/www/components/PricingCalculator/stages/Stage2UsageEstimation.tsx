'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion'
import {
  Slider_Shadcn_,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
  Input,
} from 'ui'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { ComputeBadge } from 'ui-patterns/ComputeBadge'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import { components } from 'api-types'

import pricingAddOn from '~/data/PricingAddOnTable.json'
import Panel from '~/components/Panel'
import CalloutCard from '../components/CalloutCard'
import type { CalculatorInputs, ComputeTier, SelectedProduct } from '~/lib/pricing-calculator'
import { formatUsd } from '../components/format'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

// Light spring animation for content reveal
const sectionSpring = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
  mass: 0.8,
}

type InfraComputeSize = components['schemas']['ProjectDetailResponse']['infra_compute_size']
type ComputeBadgeSize = InfraComputeSize | '>16XL' | undefined

function toComputeBadgeSize(tier: ComputeTier): ComputeBadgeSize {
  switch (tier) {
    case 'Micro':
      return 'micro'
    case 'Small':
      return 'small'
    case 'Medium':
      return 'medium'
    case 'Large':
      return 'large'
    case 'XL':
      return 'xlarge'
    case '2XL':
      return '2xlarge'
    case '4XL':
      return '4xlarge'
    case '8XL':
      return '8xlarge'
    case '12XL':
      return '12xlarge'
    case '16XL':
      return '16xlarge'
    default:
      return undefined
  }
}

function getComputeTiers(): { tier: ComputeTier; monthlyUsd: number }[] {
  const tiers: { tier: string; monthlyUsd: number }[] = []
  for (const row of pricingAddOn.database?.rows ?? []) {
    const planCol = row.columns?.find((c: any) => c.key === 'plan')
    const priceCol = row.columns?.find((c: any) => c.key === 'pricing')
    if (!planCol || !priceCol) continue
    if (priceCol.value === 'Contact Us') continue
    const price = Number(String(priceCol.value).replace('$', '').replaceAll(',', ''))
    tiers.push({ tier: String(planCol.value), monthlyUsd: Number.isFinite(price) ? price : 0 })
  }

  const allowed = new Set([
    'Micro',
    'Small',
    'Medium',
    'Large',
    'XL',
    '2XL',
    '4XL',
    '8XL',
    '12XL',
    '16XL',
  ])

  return tiers
    .filter((t) => allowed.has(t.tier))
    .map((t) => ({ tier: t.tier as ComputeTier, monthlyUsd: t.monthlyUsd }))
}

const COMPUTE_TIERS = getComputeTiers()

export default function Stage2UsageEstimation({
  inputs,
  onChange,
  freePlanEgressLimitGb,
  proEgressIncludedGb,
}: {
  inputs: CalculatorInputs
  onChange: (next: CalculatorInputs) => void
  authComparison: ReturnType<
    typeof import('~/lib/pricing-calculator/competitors').estimateAuthComparison
  >
  freePlanEgressLimitGb: number
  proEgressIncludedGb: number
}) {
  const set = (patch: Partial<CalculatorInputs>) => onChange({ ...inputs, ...patch })

  const selectedProducts = new Set(inputs.selectedProducts)
  const hasProduct = (key: SelectedProduct) => selectedProducts.has(key)

  const hasDatabase = hasProduct('database')
  const hasStorage = hasProduct('storage')
  const hasAuth = hasProduct('authentication')
  const hasRealtime = hasProduct('realtime')
  const hasFunctions = hasProduct('functions')

  // Show egress if any product is selected (egress applies to all)
  const showEgress = selectedProducts.size > 0

  // Track which add-on subsections are expanded
  const [showDatabaseAddons, setShowDatabaseAddons] = useState(false)

  // Check if any database add-ons are configured
  const hasDatabaseAddonsConfigured =
    inputs.readReplicas > 0 || inputs.pitr || inputs.branchingHoursPerMonth > 0

  return (
    <LazyMotion features={domAnimation}>
      <div className="flex flex-col gap-4">
        <AnimatePresence mode="popLayout">
          {/* Database section */}
          {hasDatabase && (
            <m.div
              key="database-section"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={sectionSpring}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-brand rounded-full" />
                <h4 className="text-foreground text-sm font-medium">Database</h4>
              </div>

              <Panel outerClassName="w-full" innerClassName="p-4 md:p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <p className="text-foreground text-sm font-medium">Database size (GB)</p>
                    <p className="text-foreground-lighter text-xs">Default 2 GB</p>
                  </div>
                  <Input
                    type="number"
                    size="small"
                    layout="vertical"
                    min={0.5}
                    value={inputs.databaseSizeGb}
                    onChange={(e: any) => set({ databaseSizeGb: Number(e.target.value) || 0 })}
                    onBlur={() => set({ databaseSizeGb: clamp(inputs.databaseSizeGb, 0.5, 10_000) })}
                    className="max-w-[120px]"
                  />
                </div>
                <Slider_Shadcn_
                  value={[inputs.databaseSizeGb]}
                  min={0.5}
                  max={100}
                  step={0.5}
                  onValueChange={(v) => set({ databaseSizeGb: v[0] })}
                />
              </Panel>

              <Panel outerClassName="w-full" innerClassName="p-4 md:p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
                  <div className="flex flex-col gap-1">
                    <p className="text-foreground text-sm font-medium">Compute tier</p>
                    <p className="text-foreground-lighter text-xs">
                      Default Micro. Each project requires dedicated compute.
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="outline"
                        size="small"
                        iconRight={<ChevronDown className="w-4 h-4" />}
                      >
                        <div className="flex items-center gap-2">
                          <ComputeBadge infraComputeSize={toComputeBadgeSize(inputs.computeTier)} />
                          <span className="text-foreground">{inputs.computeTier}</span>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="bottom" align="end">
                      {COMPUTE_TIERS.map((t) => (
                        <DropdownMenuItem
                          key={t.tier}
                          onClick={() => set({ computeTier: t.tier })}
                          className={cn(inputs.computeTier === t.tier && 'text-brand-600')}
                        >
                          <div className="flex items-center justify-between w-full gap-8">
                            <span className="flex items-center gap-2">
                              <ComputeBadge infraComputeSize={toComputeBadgeSize(t.tier)} />
                              <span>{t.tier}</span>
                            </span>
                            <span className="font-mono text-foreground-lighter" translate="no">
                              {formatUsd(t.monthlyUsd)}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2 text-foreground-lighter text-sm">
                  <InfoTooltip side="top" className="max-w-[280px]">
                    Compute is billed hourly. Temporary upgrades for migrations or traffic spikes
                    cost only for the hours used.
                  </InfoTooltip>
                  <span>Compute is billed hourly.</span>
                </div>

                <Button asChild type="default" size="tiny">
                  <Link
                    href="https://supabase.com/docs/guides/platform/compute-add-ons"
                    target="_blank"
                  >
                    Learn about Compute add-ons
                  </Link>
                </Button>
              </Panel>

              {inputs.databaseSizeGb >= 50 && (
                <CalloutCard
                  title="Architecture tip"
                  body="Databases over 50 GB often benefit from custom compute configurations to optimize performance and cost."
                >
                  <Button asChild type="default" size="tiny" className="w-fit mt-2">
                    <Link href="/contact/sales" target="_blank">
                      Discuss options
                    </Link>
                  </Button>
                </CalloutCard>
              )}

              {/* Database Add-ons toggle */}
              <button
                type="button"
                onClick={() => setShowDatabaseAddons(!showDatabaseAddons)}
                className="flex items-center gap-2 text-sm text-foreground-light hover:text-foreground transition-colors"
              >
                <m.div
                  initial={false}
                  animate={{ rotate: showDatabaseAddons ? 90 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <ChevronRight className="w-4 h-4" />
                </m.div>
                <span>Database add-ons</span>
                {hasDatabaseAddonsConfigured && (
                  <span className="text-xs text-brand-600 bg-brand-400/10 px-1.5 py-0.5 rounded">
                    configured
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showDatabaseAddons && (
                  <m.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={sectionSpring}
                    className="flex flex-col gap-3 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Panel outerClassName="w-full" innerClassName="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex flex-col gap-0.5">
                            <p className="text-foreground text-sm font-medium">Read replicas</p>
                            <p className="text-foreground-lighter text-xs">
                              Billed at same compute tier rate per replica
                            </p>
                          </div>
                          <Input
                            type="number"
                            size="small"
                            layout="vertical"
                            min={0}
                            value={inputs.readReplicas}
                            onChange={(e: any) => set({ readReplicas: Number(e.target.value) || 0 })}
                            onBlur={() =>
                              set({ readReplicas: clamp(Math.round(inputs.readReplicas), 0, 10) })
                            }
                            className="w-20 shrink-0"
                          />
                        </div>
                      </Panel>

                      <Panel outerClassName="w-full" innerClassName="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex flex-col gap-0.5">
                            <p className="text-foreground text-sm font-medium">
                              Branching hours/month
                            </p>
                            <p className="text-foreground-lighter text-xs">
                              $0.01344/hour per branch
                            </p>
                          </div>
                          <Input
                            type="number"
                            size="small"
                            layout="vertical"
                            min={0}
                            value={inputs.branchingHoursPerMonth}
                            onChange={(e: any) =>
                              set({ branchingHoursPerMonth: Number(e.target.value) || 0 })
                            }
                            onBlur={() =>
                              set({
                                branchingHoursPerMonth: clamp(
                                  Math.round(inputs.branchingHoursPerMonth),
                                  0,
                                  10000
                                ),
                              })
                            }
                            className="w-24 shrink-0"
                          />
                        </div>
                      </Panel>

                      <Panel outerClassName="w-full" innerClassName="p-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={inputs.pitr}
                            onChange={(e) => set({ pitr: e.target.checked })}
                          />
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm text-foreground">Point in time recovery</span>
                            <span className="text-xs text-foreground-lighter">
                              $100/month for 7-day retention
                            </span>
                          </div>
                        </label>
                      </Panel>

                      <Panel outerClassName="w-full" innerClassName="p-4 opacity-50">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" disabled />
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm text-foreground">ETL pipelines</span>
                            <span className="text-xs text-foreground-lighter">
                              Pricing not available while in Beta
                            </span>
                          </div>
                        </div>
                      </Panel>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </m.div>
          )}

          {/* Storage section */}
          {hasStorage && (
            <m.div
              key="storage-section"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={sectionSpring}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-brand rounded-full" />
                <h4 className="text-foreground text-sm font-medium">Storage</h4>
              </div>

              <Panel outerClassName="w-full" innerClassName="p-4 md:p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <p className="text-foreground text-sm font-medium">File storage (GB)</p>
                    <p className="text-foreground-lighter text-xs">Default 10 GB</p>
                  </div>
                  <Input
                    type="number"
                    size="small"
                    layout="vertical"
                    min={0}
                    value={inputs.storageSizeGb}
                    onChange={(e: any) => set({ storageSizeGb: Number(e.target.value) || 0 })}
                    onBlur={() => set({ storageSizeGb: clamp(inputs.storageSizeGb, 0, 100_000) })}
                    className="max-w-[120px]"
                  />
                </div>
                <Slider_Shadcn_
                  value={[inputs.storageSizeGb]}
                  min={1}
                  max={500}
                  step={1}
                  onValueChange={(v) => set({ storageSizeGb: v[0] })}
                />
              </Panel>
            </m.div>
          )}

          {/* Auth section */}
          {hasAuth && (
            <m.div
              key="auth-section"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={sectionSpring}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-brand rounded-full" />
                <h4 className="text-foreground text-sm font-medium">Authentication</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Panel outerClassName="w-full" innerClassName="p-4 md:p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <p className="text-foreground text-sm font-medium">Monthly active users</p>
                      <p className="text-foreground-lighter text-xs">Default 10,000</p>
                    </div>
                    <Input
                      type="number"
                      size="small"
                      layout="vertical"
                      min={0}
                      value={inputs.mau}
                      onChange={(e: any) => set({ mau: Number(e.target.value) || 0 })}
                      onBlur={() => set({ mau: clamp(Math.round(inputs.mau), 0, 50_000_000) })}
                      className="max-w-[140px]"
                    />
                  </div>
                  <Slider_Shadcn_
                    value={[inputs.mau]}
                    min={1000}
                    max={500000}
                    step={1000}
                    onValueChange={(v) => set({ mau: v[0] })}
                  />
                </Panel>

                <Panel outerClassName="w-full" innerClassName="p-4 md:p-5 flex flex-col gap-3">
                  <p className="text-foreground text-sm font-medium">Authentication needs</p>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm text-foreground-lighter">
                      <input
                        type="checkbox"
                        checked={inputs.needSso}
                        onChange={(e) => set({ needSso: e.target.checked })}
                      />
                      Need SSO/SAML?
                    </label>
                    <label className="flex items-center gap-2 text-sm text-foreground-lighter">
                      <input
                        type="checkbox"
                        checked={inputs.needPhoneMfa}
                        onChange={(e) => set({ needPhoneMfa: e.target.checked })}
                      />
                      Need phone-based MFA?
                    </label>
                  </div>
                  <p className="text-foreground-lighter text-xs">
                    SSO here refers to end-user SAML 2.0 (Auth). Phone MFA is priced per project
                    add-on.
                  </p>
                </Panel>
              </div>

              <CalloutCard title="Build vs buy">
                <div className="flex flex-col gap-3">
                  <div className="text-sm text-foreground-lighter">
                    Authentication is a common source of security vulnerabilities when built
                    in-house. Consider the ongoing maintenance cost of session management, token
                    refresh, and security patches.{' '}
                    <Link
                      href="https://supabase.com/blog/supabase-auth-build-vs-buy"
                      target="_blank"
                      className="transition underline text-brand-link hover:text-brand-600"
                    >
                      Read our analysis
                    </Link>
                    .
                  </div>
                </div>
              </CalloutCard>

              {(inputs.mau >= 100_000 || inputs.needSso) && (
                <CalloutCard
                  title="Enterprise pricing available"
                  body="At 100k+ MAU or with SSO requirements, annual commitments often include volume discounts and dedicated support. Enterprise plans also include SLAs and priority support."
                >
                  <Button asChild type="default" size="tiny" className="w-fit mt-2">
                    <Link href="/contact/sales" target="_blank">
                      Discuss enterprise options
                    </Link>
                  </Button>
                </CalloutCard>
              )}
            </m.div>
          )}

          {/* Realtime section */}
          {hasRealtime && (
            <m.div
              key="realtime-section"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={sectionSpring}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-brand rounded-full" />
                <h4 className="text-foreground text-sm font-medium">Realtime</h4>
              </div>

              <Panel outerClassName="w-full" innerClassName="p-4 md:p-5 flex flex-col gap-3">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <p className="text-foreground text-sm font-medium">
                        Concurrent realtime connections
                      </p>
                      <p className="text-foreground-lighter text-xs">Peak simultaneous connections</p>
                    </div>
                    <Input
                      type="number"
                      size="small"
                      layout="vertical"
                      min={0}
                      value={inputs.realtimePeakConnections}
                      onChange={(e: any) =>
                        set({ realtimePeakConnections: Number(e.target.value) || 0 })
                      }
                      onBlur={() =>
                        set({
                          realtimePeakConnections: clamp(
                            Math.round(inputs.realtimePeakConnections),
                            0,
                            10_000_000
                          ),
                        })
                      }
                      className="max-w-[140px]"
                    />
                  </div>
                  <Slider_Shadcn_
                    value={[inputs.realtimePeakConnections]}
                    min={0}
                    max={5000}
                    step={10}
                    onValueChange={(v) => set({ realtimePeakConnections: v[0] })}
                  />

                  <div className="flex items-start justify-between gap-2 mt-2">
                    <div className="flex flex-col gap-1">
                      <p className="text-foreground text-sm font-medium">
                        Realtime messages per month
                      </p>
                      <p className="text-foreground-lighter text-xs">
                        Broadcast, presence, and DB changes
                      </p>
                    </div>
                    <Input
                      type="number"
                      size="small"
                      layout="vertical"
                      min={0}
                      value={inputs.realtimeMessages}
                      onChange={(e: any) => set({ realtimeMessages: Number(e.target.value) || 0 })}
                      onBlur={() =>
                        set({
                          realtimeMessages: clamp(
                            Math.round(inputs.realtimeMessages),
                            0,
                            10_000_000_000
                          ),
                        })
                      }
                      className="max-w-[160px]"
                    />
                  </div>
                  <Slider_Shadcn_
                    value={[inputs.realtimeMessages]}
                    min={0}
                    max={10_000_000}
                    step={50_000}
                    onValueChange={(v) => set({ realtimeMessages: v[0] })}
                  />
                </div>
              </Panel>
            </m.div>
          )}

          {/* Edge Functions section */}
          {hasFunctions && (
            <m.div
              key="functions-section"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={sectionSpring}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-brand rounded-full" />
                <h4 className="text-foreground text-sm font-medium">Edge Functions</h4>
              </div>

              <Panel outerClassName="w-full" innerClassName="p-4 md:p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <p className="text-foreground text-sm font-medium">
                      Edge function invocations per month
                    </p>
                    <p className="text-foreground-lighter text-xs">Serverless function calls</p>
                  </div>
                  <Input
                    type="number"
                    size="small"
                    layout="vertical"
                    min={0}
                    value={inputs.edgeInvocations}
                    onChange={(e: any) => set({ edgeInvocations: Number(e.target.value) || 0 })}
                    onBlur={() =>
                      set({
                        edgeInvocations: clamp(
                          Math.round(inputs.edgeInvocations),
                          0,
                          10_000_000_000
                        ),
                      })
                    }
                    className="max-w-[160px]"
                  />
                </div>
                <Slider_Shadcn_
                  value={[inputs.edgeInvocations]}
                  min={0}
                  max={5_000_000}
                  step={50_000}
                  onValueChange={(v) => set({ edgeInvocations: v[0] })}
                />
              </Panel>
            </m.div>
          )}

          {/* Egress section - always shown when any product is selected */}
          {showEgress && (
            <m.div
              key="egress-section"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={sectionSpring}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-foreground-muted rounded-full" />
                <h4 className="text-foreground text-sm font-medium">Bandwidth</h4>
              </div>

              <Panel outerClassName="w-full" innerClassName="p-4 md:p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <p className="text-foreground text-sm font-medium">
                      Expected monthly egress (GB)
                    </p>
                    <p className="text-foreground-lighter text-xs">
                      Data transferred out of Supabase
                    </p>
                  </div>
                  <Input
                    type="number"
                    size="small"
                    layout="vertical"
                    min={0}
                    value={inputs.egressGb}
                    onChange={(e: any) => set({ egressGb: Number(e.target.value) || 0 })}
                    onBlur={() => set({ egressGb: clamp(inputs.egressGb, 0, 100_000) })}
                    className="max-w-[120px]"
                  />
                </div>
                <Slider_Shadcn_
                  value={[inputs.egressGb]}
                  min={0}
                  max={1000}
                  step={1}
                  onValueChange={(v) => set({ egressGb: v[0] })}
                />
              </Panel>

              {inputs.egressGb <= freePlanEgressLimitGb ? (
                <CalloutCard
                  title="Egress note"
                  body="Your estimated egress is within the free tier's 5 GB limit. Egress is one of the most common reasons teams upgrade to Pro."
                />
              ) : inputs.egressGb > proEgressIncludedGb ? (
                <CalloutCard
                  title="Egress pricing"
                  body="High-egress workloads benefit from predictable pricing. Supabase charges $0.09/GB for overage beyond included limits."
                />
              ) : null}
            </m.div>
          )}

          {/* Platform Add-ons section */}
          {selectedProducts.size > 0 && (
            <m.div
              key="platform-addons-section"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={sectionSpring}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-foreground-muted rounded-full" />
                <h4 className="text-foreground text-sm font-medium">Platform add-ons</h4>
              </div>

              <Panel outerClassName="w-full" innerClassName="p-4 md:p-5 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inputs.customDomain}
                      onChange={(e) => set({ customDomain: e.target.checked })}
                      className="mt-0.5"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">Custom domain</span>
                      <span className="text-xs text-foreground-lighter">
                        Use your own domain for APIs. $10/mo.
                      </span>
                    </div>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inputs.ipv4}
                      onChange={(e) => set({ ipv4: e.target.checked })}
                      className="mt-0.5"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">IPv4 address</span>
                      <span className="text-xs text-foreground-lighter">
                        Dedicated IPv4 for direct connections. $4/mo.
                      </span>
                    </div>
                  </label>
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={inputs.logDrains > 0}
                      onChange={(e) => set({ logDrains: e.target.checked ? 1 : 0 })}
                      className="mt-0.5"
                    />
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-foreground">Log drains</span>
                      <span className="text-xs text-foreground-lighter">
                        Export logs to external services. $60/mo per drain.
                      </span>
                      {inputs.logDrains > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-foreground-lighter">Count:</span>
                          <Input
                            type="number"
                            size="small"
                            layout="vertical"
                            min={1}
                            value={inputs.logDrains}
                            onChange={(e: any) => set({ logDrains: Number(e.target.value) || 0 })}
                            onBlur={() =>
                              set({ logDrains: clamp(Math.round(inputs.logDrains), 1, 10) })
                            }
                            className="max-w-[60px]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 opacity-50">
                    <input type="checkbox" disabled className="mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">AWS PrivateLink</span>
                      <span className="text-xs text-foreground-lighter">
                        Private connectivity. Included with Team/Enterprise.
                      </span>
                    </div>
                  </div>
                </div>
              </Panel>

              {inputs.needCompliance && (
                <CalloutCard
                  title="Compliance add-ons"
                  body="HIPAA and SOC 2 compliance are available as Enterprise add-ons. Contact sales to discuss your compliance requirements."
                >
                  <Button asChild type="default" size="tiny" className="w-fit mt-2">
                    <Link href="/contact/sales" target="_blank">
                      Discuss compliance
                    </Link>
                  </Button>
                </CalloutCard>
              )}
            </m.div>
          )}

          {/* Empty state */}
          {selectedProducts.size === 0 && (
            <m.div
              key="empty-state"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={sectionSpring}
            >
              <CalloutCard
                title="No products selected"
                body="Go back to Step 1 to select the Supabase products you want to include in your estimate."
              />
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  )
}

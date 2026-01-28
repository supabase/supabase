'use client'

import Link from 'next/link'
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
import { ChevronDown } from 'lucide-react'
import { ComputeBadge } from 'ui-patterns/ComputeBadge'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import { components } from 'api-types'

import pricingAddOn from '~/data/PricingAddOnTable.json'
import Panel from '~/components/Panel'
import CalloutCard from '../components/CalloutCard'
import type { CalculatorInputs, ComputeTier } from '~/lib/pricing-calculator'
import { formatUsd, formatNumber } from '../components/format'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

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
  authComparison,
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

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              value={String(inputs.databaseSizeGb)}
              onChange={(e: any) =>
                set({ databaseSizeGb: clamp(Number(e.target.value || 0.5), 0.5, 10_000) })
              }
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
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <p className="text-foreground text-sm font-medium">File storage (GB)</p>
              <p className="text-foreground-lighter text-xs">Default 10 GB</p>
            </div>
            <Input
              type="number"
              size="small"
              layout="vertical"
              value={String(inputs.storageSizeGb)}
              onChange={(e: any) =>
                set({ storageSizeGb: clamp(Number(e.target.value || 0), 0, 100_000) })
              }
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
      </div>

      <CalloutCard
        title="Key consideration"
        body="Supabase includes unlimited API requests. Firebase charges $0.18 per 100,000 reads/writes, which compounds quickly."
      />

      <Panel outerClassName="w-full" innerClassName="p-4 md:p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <p className="text-foreground text-sm font-medium">Expected monthly egress (GB)</p>
            <p className="text-foreground-lighter text-xs">Default 50 GB</p>
          </div>
          <Input
            type="number"
            size="small"
            layout="vertical"
            value={String(inputs.egressGb)}
            onChange={(e: any) => set({ egressGb: clamp(Number(e.target.value || 0), 0, 100_000) })}
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
          title="Key consideration"
          body="The free tier's 5 GB egress limit is the most common upgrade trigger. At your estimated usage, you're well within Pro limits."
        />
      ) : inputs.egressGb > proEgressIncludedGb ? (
        <CalloutCard
          title="Key consideration"
          body="High egress workloads like yours benefit from Supabase's flat $0.09/GB vs Firebase's variable regional pricing."
        />
      ) : null}

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
              value={String(inputs.mau)}
              onChange={(e: any) =>
                set({ mau: clamp(Math.round(Number(e.target.value || 0)), 0, 50_000_000) })
              }
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
            SSO here refers to end-user SAML 2.0 (Auth). Phone MFA is priced per project add-on.
          </p>
        </Panel>
      </div>

      <CalloutCard title="Key consideration">
        <div className="flex flex-col gap-3">
          <div className="text-sm text-foreground-lighter">
            Building your own authentication is error prone and complex. It’s costly to build and
            costly to maintain.{' '}
            <Link
              href="https://supabase.com/blog/supabase-auth-build-vs-buy"
              target="_blank"
              className="transition underline text-brand-link hover:text-brand-600"
            >
              Read our blog post
            </Link>{' '}
            for more information.
          </div>
        </div>
      </CalloutCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Panel outerClassName="w-full" innerClassName="p-4 md:p-5 flex flex-col gap-3">
          <p className="text-foreground text-sm font-medium">Realtime</p>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <p className="text-foreground-lighter text-xs">Concurrent realtime connections</p>
              </div>
              <Input
                type="number"
                size="small"
                layout="vertical"
                value={String(inputs.realtimePeakConnections)}
                onChange={(e: any) =>
                  set({
                    realtimePeakConnections: clamp(
                      Math.round(Number(e.target.value || 0)),
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

            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <p className="text-foreground-lighter text-xs">Realtime messages per month</p>
              </div>
              <Input
                type="number"
                size="small"
                layout="vertical"
                value={String(inputs.realtimeMessages)}
                onChange={(e: any) =>
                  set({
                    realtimeMessages: clamp(
                      Math.round(Number(e.target.value || 0)),
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

        <Panel outerClassName="w-full" innerClassName="p-4 md:p-5 flex flex-col gap-3">
          <p className="text-foreground text-sm font-medium">Edge Functions</p>
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <p className="text-foreground-lighter text-xs">Edge function invocations per month</p>
            </div>
            <Input
              type="number"
              size="small"
              layout="vertical"
              value={String(inputs.edgeInvocations)}
              onChange={(e: any) =>
                set({
                  edgeInvocations: clamp(
                    Math.round(Number(e.target.value || 0)),
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
      </div>

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
              <Button type="outline" size="small" iconRight={<ChevronDown className="w-4 h-4" />}>
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
            Compute is billed hourly. Temporary upgrades for migrations or traffic spikes cost only
            for the hours used.
          </InfoTooltip>
          <span>Compute is billed hourly.</span>
        </div>

        <Button asChild type="default" size="tiny">
          <Link href="https://supabase.com/docs/guides/platform/compute-add-ons" target="_blank">
            Learn about Compute add-ons
          </Link>
        </Button>
      </Panel>

      {/* Upsell triggers during input stages */}
      {(inputs.mau >= 100_000 || inputs.needSso) && (
        <CalloutCard
          title="Find more cost savings"
          body="At your scale, custom enterprise pricing typically saves 20-40%. Want to discuss volume options?"
        >
          <Button asChild type="default" size="tiny" className="w-fit mt-2">
            <Link href="/contact/sales" target="_blank">
              Talk to sales
            </Link>
          </Button>
        </CalloutCard>
      )}
      {inputs.databaseSizeGb >= 50 && (
        <CalloutCard
          title="Upsell"
          body="Databases over 50 GB benefit from custom compute configurations. Let's optimize your architecture."
        >
          <Button asChild type="default" size="tiny" className="w-fit mt-2">
            <Link href="/contact/sales" target="_blank">
              Schedule consultation
            </Link>
          </Button>
        </CalloutCard>
      )}
    </div>
  )
}

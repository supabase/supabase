'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import Panel from '~/components/Panel'
import type { PricingReport, ProjectionSeries, RoiSummary } from '~/lib/pricing-calculator'
import { estimateCompetitorMonthlyUsdForKey } from '~/lib/pricing-calculator/competitors'
import { getCompetitorSnapshot } from '~/lib/pricing-calculator/competitors'
import GrowthChart from './GrowthChart'
import HowCalculated from './HowCalculated'
import { formatNumber, formatUsd } from './format'

type AuthComparison = ReturnType<
  typeof import('~/lib/pricing-calculator/competitors').estimateAuthComparison
>

export default function ReportView({
  pricingReport,
  roiSummary,
  projectionSeries,
  authComparison,
  onViewed,
}: {
  pricingReport: PricingReport
  roiSummary: RoiSummary
  projectionSeries: ProjectionSeries
  authComparison: AuthComparison
  onViewed?: () => void
}) {
  useEffect(() => {
    onViewed?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const recommended = pricingReport.recommended.plan
  const estimate = pricingReport.estimates[recommended]

  const annualSupabase = estimate.totalMonthlyUsd * 12

  // Calculate Convex and AWS costs based on full inputs
  const convexEstimate = estimateCompetitorMonthlyUsdForKey('convex', pricingReport.inputs)
  const awsEstimate = estimateCompetitorMonthlyUsdForKey('aws', pricingReport.inputs)
  const competitorSnapshot = getCompetitorSnapshot()

  return (
    <div className="flex flex-col gap-4 mt-4">
      {/* Executive Summary */}
      <Panel outerClassName="w-full" innerClassName="p-5 md:p-6 flex flex-col gap-3">
        <h3 className="text-foreground text-lg">Executive summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="border rounded-lg p-4">
            <p className="text-foreground-lighter text-sm">Recommended tier</p>
            <p className="text-foreground text-xl font-mono">{recommended.toUpperCase()}</p>
            <p className="text-foreground-lighter text-sm mt-1">
              Estimated monthly cost:{' '}
              <span className="text-foreground">{formatUsd(estimate.totalMonthlyUsd)}</span>
            </p>
            <p className="text-foreground-lighter text-xs mt-2">
              This estimate is based on Supabase pricing and the inputs you provided.
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-foreground-lighter text-sm">Estimated annual cost</p>
            <p className="text-foreground text-xl font-mono">{formatUsd(annualSupabase)}</p>
            <p className="text-foreground-lighter text-xs mt-2">
              Subscription, compute, and any overages (based on your inputs).
            </p>
          </div>
        </div>
        <p className="text-foreground-lighter text-sm">
          Notes:{' '}
          <span className="text-foreground">{pricingReport.recommended.reasons[0] ?? ''}</span>
        </p>
      </Panel>

      {/* Projected Costs over Time */}
      <Panel outerClassName="w-full" innerClassName="p-5 md:p-6 flex flex-col gap-3">
        <h3 className="text-foreground text-lg">Projected costs over time</h3>
        <GrowthChart
          title="Projected costs over time"
          subtitle="Supabase estimate based on your inputs"
          series={projectionSeries}
        />
        <HowCalculated
          items={[
            'Each month, we grow MAU and data according to your Stage 3 inputs',
            'We recompute Supabase monthly cost based on the updated usage',
          ]}
        />
      </Panel>

      {/* Pricing Details */}
      <Panel outerClassName="w-full" innerClassName="p-5 md:p-6 flex flex-col gap-3">
        <h3 className="text-foreground text-lg">Pricing details</h3>
        <div className="flex flex-col gap-2">
          {estimate.lineItems.map((li) => (
            <div key={li.key} className="flex items-start justify-between gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-foreground-lighter">{li.key.replaceAll('_', ' ')}</span>
                {li.details?.length ? (
                  <ul className="text-foreground-muted text-xs list-disc pl-5">
                    {li.details.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <span className="text-foreground font-mono" translate="no">
                {formatUsd(li.monthlyUsd)}
              </span>
            </div>
          ))}
          <div className="border-t pt-3 flex items-center justify-between">
            <span className="text-foreground">Total</span>
            <span className="text-foreground font-mono" translate="no">
              {formatUsd(estimate.totalMonthlyUsd)}/mo
            </span>
          </div>
        </div>
        <HowCalculated
          items={[
            'Compute cost = projects × selected compute tier monthly price',
            'Compute credits apply once per paid organization and offset compute cost',
            'Database included quota is per project; most other quotas are per organization',
            'Overages are charged only for usage beyond included quotas (where applicable)',
          ]}
        />
      </Panel>

      {/* Value Analysis */}
      <Panel outerClassName="w-full" innerClassName="p-5 md:p-6 flex flex-col gap-3">
        <h3 className="text-foreground text-lg">Value analysis</h3>
        <div className="border rounded-lg p-4 flex flex-col gap-4">
          <div>
            <p className="text-foreground-lighter text-sm">Time reallocation estimate</p>
            <p className="text-foreground text-xl font-mono">
              {formatNumber(roiSummary.hoursRecoveredPerMonth)} hrs/mo
            </p>
            <p className="text-foreground-lighter text-sm mt-1">
              That&apos;s {formatNumber(roiSummary.hoursRecoveredPerYear)} hours/year, valued at{' '}
              <span className="text-foreground">
                {formatUsd(roiSummary.valueRecoveredPerYearUsd)}
              </span>{' '}
              using your hourly rate.
            </p>
          </div>
          <div className="border-t pt-4 flex flex-col gap-3">
            <p className="text-foreground text-sm font-medium">How we calculate this</p>
            <div className="text-foreground-lighter text-sm space-y-2">
              <p>
                <strong className="text-foreground">Step 1:</strong> We start with how many hours
                your team spends each month on infrastructure tasks. If you provided this in Stage
                4, we use your numbers. Otherwise, we estimate based on your team size:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Authentication: {formatNumber(roiSummary.breakdown.auth.hoursBefore)} hours/month
                </li>
                <li>
                  Database management: {formatNumber(roiSummary.breakdown.database.hoursBefore)}{' '}
                  hours/month
                </li>
                <li>
                  API development: {formatNumber(roiSummary.breakdown.api.hoursBefore)} hours/month
                </li>
                <li>
                  DevOps and infrastructure: {formatNumber(roiSummary.breakdown.devops.hoursBefore)}{' '}
                  hours/month
                </li>
              </ul>
              <p>
                <strong className="text-foreground">Step 2:</strong> We estimate how much time
                Supabase saves you in each area. Based on typical customer experiences, we apply
                these reduction percentages:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Authentication: {Math.round(roiSummary.breakdown.auth.reductionPct * 100)}%
                  reduction = {formatNumber(roiSummary.breakdown.auth.hoursRecovered)} hours/month
                  recovered
                </li>
                <li>
                  Database management:{' '}
                  {Math.round(roiSummary.breakdown.database.reductionPct * 100)}% reduction ={' '}
                  {formatNumber(roiSummary.breakdown.database.hoursRecovered)} hours/month recovered
                </li>
                <li>
                  API development: {Math.round(roiSummary.breakdown.api.reductionPct * 100)}%
                  reduction = {formatNumber(roiSummary.breakdown.api.hoursRecovered)} hours/month
                  recovered
                </li>
                <li>
                  DevOps and infrastructure:{' '}
                  {Math.round(roiSummary.breakdown.devops.reductionPct * 100)}% reduction ={' '}
                  {formatNumber(roiSummary.breakdown.devops.hoursRecovered)} hours/month recovered
                </li>
              </ul>
              <p>
                <strong className="text-foreground">Step 3:</strong> We add up all the recovered
                hours ({formatNumber(roiSummary.hoursRecoveredPerMonth)} hours/month) and multiply
                by your hourly cost rate to get the dollar value:{' '}
                {formatUsd(roiSummary.valueRecoveredPerMonthUsd)}/month, or{' '}
                {formatUsd(roiSummary.valueRecoveredPerYearUsd)} per year.
              </p>
            </div>
          </div>
        </div>
      </Panel>

      {/* Competitive Comparison */}
      <Panel outerClassName="w-full" innerClassName="p-5 md:p-6 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-foreground text-lg">Competitive comparison</h3>
          <p className="text-foreground-lighter text-xs">
            Pricing as of{' '}
            {new Date(authComparison.snapshot.as_of).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-4 bg-surface-200 text-xs">
            <div className="p-2 text-foreground-lighter">Provider</div>
            <div className="p-2 text-foreground-lighter text-right">Monthly</div>
            <div className="p-2 text-foreground-lighter text-right">Annual</div>
            <div className="p-2 text-foreground-lighter text-right">Notes</div>
          </div>
          <Row
            provider="Supabase"
            monthly={estimate.totalMonthlyUsd}
            annual={annualSupabase}
            notes={`Recommended: ${recommended.toUpperCase()}`}
          />
          {authComparison.firebaseMonthlyUsd != null ? (
            <RowWithSources
              provider="Firebase"
              monthly={authComparison.firebaseMonthlyUsd}
              annual={authComparison.firebaseMonthlyUsd * 12}
              notes={authComparison.snapshot.providers.firebase.plan_name}
              sourceUrls={authComparison.snapshot.providers.firebase.source_urls}
            />
          ) : (
            <RowLink provider="Firebase" href="https://firebase.google.com/pricing" />
          )}
          {authComparison.auth0MonthlyUsd != null ? (
            <RowWithSources
              provider="Auth0"
              monthly={authComparison.auth0MonthlyUsd}
              annual={authComparison.auth0MonthlyUsd * 12}
              notes={authComparison.snapshot.providers.auth0.plan_name}
              sourceUrls={authComparison.snapshot.providers.auth0.source_urls}
            />
          ) : (
            <RowLink provider="Auth0" href="https://auth0.com/pricing" />
          )}
          {authComparison.clerkMonthlyUsd != null ? (
            <RowWithSources
              provider="Clerk"
              monthly={authComparison.clerkMonthlyUsd}
              annual={authComparison.clerkMonthlyUsd * 12}
              notes={authComparison.snapshot.providers.clerk.plan_name}
              sourceUrls={authComparison.snapshot.providers.clerk.source_urls}
            />
          ) : (
            <RowLink provider="Clerk" href="https://clerk.com/pricing" />
          )}
          <RowWithSources
            provider="Convex"
            monthly={convexEstimate.monthlyUsd}
            annual={convexEstimate.monthlyUsd * 12}
            notes={competitorSnapshot.providers.convex.plan_name}
            sourceUrls={competitorSnapshot.providers.convex.source_urls}
          />
          <RowWithSources
            provider="AWS"
            monthly={awsEstimate.monthlyUsd}
            annual={awsEstimate.monthlyUsd * 12}
            notes={competitorSnapshot.providers.aws.plan_name}
            sourceUrls={competitorSnapshot.providers.aws.source_urls}
          />
        </div>
        <div className="flex flex-col gap-2 text-foreground-lighter text-xs">
          <p>
            <strong>Note:</strong> Pricing estimates vary by provider model. Auth providers
            (Firebase, Auth0, Clerk) are based on authentication costs. Full-stack providers
            (Convex, AWS) are modeled based on typical usage patterns for database, storage,
            bandwidth, and compute. See source links and detailed assumptions below for full pricing
            details.
          </p>
          <details className="cursor-pointer">
            <summary className="text-brand hover:text-brand-600">View detailed assumptions</summary>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {authComparison.snapshot.providers.firebase.notes && (
                <li>
                  <strong>Firebase:</strong> {authComparison.snapshot.providers.firebase.notes}
                </li>
              )}
              {authComparison.snapshot.providers.clerk.notes && (
                <li>
                  <strong>Clerk:</strong> {authComparison.snapshot.providers.clerk.notes}
                </li>
              )}
              {authComparison.snapshot.providers.auth0.notes && (
                <li>
                  <strong>Auth0:</strong> {authComparison.snapshot.providers.auth0.notes}
                </li>
              )}
              {competitorSnapshot.providers.convex.notes && (
                <li>
                  <strong>Convex:</strong> {competitorSnapshot.providers.convex.notes}
                </li>
              )}
              {competitorSnapshot.providers.aws.notes && (
                <li>
                  <strong>AWS:</strong> {competitorSnapshot.providers.aws.notes}
                </li>
              )}
            </ul>
          </details>
        </div>
      </Panel>
    </div>
  )
}

function Row({
  provider,
  monthly,
  annual,
  notes,
}: {
  provider: string
  monthly: number
  annual: number
  notes: string
}) {
  return (
    <div className="grid grid-cols-4 border-t text-sm">
      <div className="p-2 text-foreground-lighter capitalize">{provider.replaceAll('_', ' ')}</div>
      <div className="p-2 text-right text-foreground font-mono" translate="no">
        {formatUsd(monthly)}
      </div>
      <div className="p-2 text-right text-foreground font-mono" translate="no">
        {formatUsd(annual)}
      </div>
      <div className="p-2 text-right text-foreground-lighter">{notes}</div>
    </div>
  )
}

function RowWithSources({
  provider,
  monthly,
  annual,
  notes,
  sourceUrls,
}: {
  provider: string
  monthly: number
  annual: number
  notes: string
  sourceUrls: string[]
}) {
  return (
    <div className="grid grid-cols-4 border-t text-sm">
      <div className="p-2 text-foreground-lighter">{provider}</div>
      <div className="p-2 text-right text-foreground font-mono" translate="no">
        {formatUsd(monthly)}
      </div>
      <div className="p-2 text-right text-foreground font-mono" translate="no">
        {formatUsd(annual)}
      </div>
      <div className="p-2 text-right text-foreground-lighter text-xs">
        <div className="flex flex-col gap-1 items-end">
          <span className="line-clamp-1">{notes}</span>
          <div className="flex gap-1">
            {sourceUrls.map((url, idx) => (
              <Link
                key={idx}
                href={url}
                target="_blank"
                className="underline text-brand hover:text-brand-600 text-xs"
              >
                Source{sourceUrls.length > 1 ? ` ${idx + 1}` : ''}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function RowLink({ provider, href }: { provider: string; href: string }) {
  return (
    <div className="grid grid-cols-4 border-t text-sm">
      <div className="p-2 text-foreground-lighter">{provider}</div>
      <div className="p-2 text-right text-foreground-lighter">—</div>
      <div className="p-2 text-right text-foreground-lighter">—</div>
      <div className="p-2 text-right">
        <Link href={href} target="_blank" className="underline text-brand hover:text-brand-600">
          Pricing
        </Link>
      </div>
    </div>
  )
}

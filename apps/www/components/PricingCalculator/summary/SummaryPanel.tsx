'use client'

import Link from 'next/link'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { Button, cn } from 'ui'
import Panel from '~/components/Panel'
import type { PricingReport, RoiSummary } from '~/lib/pricing-calculator'
import { formatNumber, formatUsd } from '../components/format'

type Props = {
  className?: string
  pricingReport: PricingReport
  roiSummary: RoiSummary
  onTalkToSales?: () => void
}

const DIMENSIONS: { key: keyof PricingReport['estimates']['free']['fits']; label: string }[] = [
  { key: 'projects', label: 'Projects' },
  { key: 'database_size', label: 'Database' },
  { key: 'storage_size', label: 'Storage' },
  { key: 'egress', label: 'Egress' },
  { key: 'mau', label: 'MAU' },
  { key: 'sso', label: 'SSO/SAML' },
  { key: 'phone_mfa', label: 'Phone MFA' },
  { key: 'realtime_peak_connections', label: 'Realtime connections' },
  { key: 'realtime_messages', label: 'Realtime messages' },
  { key: 'edge_invocations', label: 'Edge invocations' },
  { key: 'compliance', label: 'Compliance' },
]

function StatusIcon({ status }: { status: string }) {
  if (status === 'ok') return <CheckCircle2 className="w-4 h-4 text-brand" />
  if (status === 'overage') return <AlertTriangle className="w-4 h-4 text-amber-500" />
  return <XCircle className="w-4 h-4 text-red-500" />
}

export default function SummaryPanel({
  className,
  pricingReport,
  roiSummary,
  onTalkToSales,
}: Props) {
  const { estimates, recommended } = pricingReport

  const recommendedEstimate = estimates[recommended.plan]

  const showSalesCta =
    recommendedEstimate.totalMonthlyUsd >= 500 || pricingReport.inputs.needCompliance

  return (
    <Panel outerClassName={cn('w-full', className)} innerClassName="p-5 md:p-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-foreground text-lg">Live cost summary</h3>
        <p className="text-foreground-lighter text-sm">
          Recommended tier:{' '}
          <span className="text-foreground">{recommended.plan.toUpperCase()}</span>
        </p>
        {recommended.reasons.length > 0 && (
          <ul className="text-foreground-lighter text-sm list-disc pl-5 mt-2">
            {recommended.reasons.slice(0, 3).map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(['free', 'pro', 'team'] as const).map((plan) => (
          <div
            key={plan}
            className={cn('border rounded-lg p-3', plan === recommended.plan && 'border-stronger')}
          >
            <p className="text-foreground text-xs font-medium uppercase truncate">{plan}</p>
            <p className="text-foreground mt-1 font-mono text-sm" translate="no">
              {formatUsd(estimates[plan].totalMonthlyUsd)}
              <span className="text-foreground-lighter text-xs font-sans">/mo</span>
            </p>
          </div>
        ))}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-4 bg-surface-200 text-xs">
          <div className="p-2 text-foreground-lighter">Dimension</div>
          <div className="p-2 text-foreground-lighter text-center">Free</div>
          <div className="p-2 text-foreground-lighter text-center">Pro</div>
          <div className="p-2 text-foreground-lighter text-center">Team</div>
        </div>
        {DIMENSIONS.map((d) => (
          <div key={d.key} className="grid grid-cols-4 border-t text-sm">
            <div className="p-2 text-foreground-lighter">{d.label}</div>
            <div className="p-2 flex justify-center">
              <StatusIcon status={estimates.free.fits[d.key]} />
            </div>
            <div className="p-2 flex justify-center">
              <StatusIcon status={estimates.pro.fits[d.key]} />
            </div>
            <div className="p-2 flex justify-center">
              <StatusIcon status={estimates.team.fits[d.key]} />
            </div>
          </div>
        ))}
      </div>

      {showSalesCta && (
        <Panel outerClassName="w-full" innerClassName="p-4 bg-alternative flex flex-col gap-3">
          <p className="text-foreground text-sm font-medium">Need custom pricing?</p>
          <p className="text-foreground-lighter text-sm">
            For teams spending $500+/month, annual commitments unlock 15-25% savings.
          </p>
          <Button asChild type="default" size="tiny" onClick={onTalkToSales}>
            <Link href="/contact/sales" target="_blank">
              Contact sales
            </Link>
          </Button>
        </Panel>
      )}

      <div className="flex items-center gap-2">
        <Button asChild type="outline" size="tiny">
          <Link href="/pricing" target="_blank">
            View pricing page
          </Link>
        </Button>
        <Button asChild type="default" size="tiny" onClick={onTalkToSales}>
          <Link href="/contact/sales" target="_blank">
            Talk to sales
          </Link>
        </Button>
      </div>
    </Panel>
  )
}

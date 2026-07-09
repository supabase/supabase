import { Card, CardContent, CardHeader, CardTitle } from 'ui'

const STAGE_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  viewed: 'Viewed',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
}

const CURRENCY = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

interface PipelineByStageProps {
  pipeline: { stage: string; count: number; amount: number }[]
}

export function PipelineByStage({ pipeline }: PipelineByStageProps) {
  const maxAmount = Math.max(...pipeline.map((p) => p.amount), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Pipeline by stage</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {pipeline.map(({ stage, count, amount }) => (
          <div key={stage} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">{STAGE_LABELS[stage] ?? stage}</span>
              <span className="text-foreground-light">
                {count} · {CURRENCY.format(amount)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-200">
              <div
                className="h-full rounded-full bg-brand-600"
                style={{ width: `${Math.max((amount / maxAmount) * 100, amount > 0 ? 4 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

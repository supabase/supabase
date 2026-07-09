import { Card, CardContent, CardHeader, CardTitle } from 'ui'

import { PipelineByStage } from '@/components/pipeline-by-stage'
import { StatCard } from '@/components/stat-card'
import { getDashboardStats } from '@/lib/queries'

const CURRENCY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const ACTIVITY_LABELS: Record<string, string> = {
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
  note: 'Note',
  follow_up: 'Follow-up',
}

export default async function DashboardPage() {
  const { revenue, quotesSentThisMonth, winRate, followUpsDue, pipeline } = await getDashboardStats()

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Revenue (this month)" value={CURRENCY.format(revenue)} hint="Accepted quotes" />
        <StatCard label="Quotes sent" value={String(quotesSentThisMonth)} hint="This month" />
        <StatCard label="Win rate" value={winRate === null ? '—' : `${winRate}%`} hint="Accepted vs declined" />
        <StatCard label="Follow-ups due" value={String(followUpsDue.length)} hint="Overdue or due today" />
      </div>

      <PipelineByStage pipeline={pipeline} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Follow-ups due</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {followUpsDue.length === 0 && (
            <p className="text-sm text-foreground-light">Nothing due — you are all caught up.</p>
          )}
          {followUpsDue.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between gap-2 border-b pb-2 last:border-0">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{activity.subject}</span>
                <span className="text-xs text-foreground-light">
                  {ACTIVITY_LABELS[activity.type] ?? activity.type}
                  {activity.due_at ? ` · ${new Date(activity.due_at).toLocaleString()}` : ''}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

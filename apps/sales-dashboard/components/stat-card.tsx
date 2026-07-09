import { Card, CardContent } from 'ui'

interface StatCardProps {
  label: string
  value: string
  hint?: string
  icon?: React.ReactNode
}

export function StatCard({ label, value, hint, icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-2 p-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-foreground-light">{label}</span>
          <span className="text-2xl font-medium text-foreground">{value}</span>
          {hint && <span className="text-xs text-foreground-muted">{hint}</span>}
        </div>
        {icon && <div className="text-foreground-muted">{icon}</div>}
      </CardContent>
    </Card>
  )
}

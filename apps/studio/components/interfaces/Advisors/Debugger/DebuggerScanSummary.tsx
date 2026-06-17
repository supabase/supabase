import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { Badge, cn } from 'ui'

import type { DebuggerFinding, DebuggerSeverity } from './triage/debugger-triage'

const SEVERITY_ORDER: DebuggerSeverity[] = ['critical', 'warning', 'info', 'ok']

const SEVERITY_CONFIG: Record<
  DebuggerSeverity,
  {
    label: string
    icon: React.ComponentType<{ size?: number; className?: string }>
    badgeVariant: string
    rowClass: string
  }
> = {
  critical: {
    label: 'Critical',
    icon: AlertCircle,
    badgeVariant: 'destructive',
    rowClass: 'border-l-2 border-destructive',
  },
  warning: {
    label: 'Warning',
    icon: AlertTriangle,
    badgeVariant: 'warning',
    rowClass: 'border-l-2 border-warning',
  },
  info: {
    label: 'Info',
    icon: Info,
    badgeVariant: 'default',
    rowClass: 'border-l-2 border-foreground-muted',
  },
  ok: {
    label: 'OK',
    icon: CheckCircle,
    badgeVariant: 'outline',
    rowClass: 'border-l-2 border-brand',
  },
}

const CATEGORY_LABELS: Record<string, string> = {
  locks: 'Locks',
  storage: 'Storage',
  performance: 'Performance',
  connections: 'Connections',
}

interface DebuggerScanSummaryProps {
  findings: DebuggerFinding[]
}

export function DebuggerScanSummary({ findings }: DebuggerScanSummaryProps) {
  const sorted = [...findings].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
  )

  if (sorted.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-foreground-light py-2">
        <CheckCircle size={14} className="text-brand" />
        <span>No issues detected. Your database looks healthy.</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sorted.map((finding) => {
        const config = SEVERITY_CONFIG[finding.severity]
        const Icon = config.icon

        return (
          <div
            key={finding.id}
            className={cn(
              'flex flex-col gap-1 rounded-r bg-surface-100 px-4 py-3',
              config.rowClass
            )}
          >
            <div className="flex items-center gap-2">
              <Icon size={14} className="shrink-0 text-foreground-light" />
              <span className="text-sm font-medium text-foreground">{finding.title}</span>
              <Badge variant={config.badgeVariant as any} className="ml-auto text-xs shrink-0">
                {CATEGORY_LABELS[finding.category] ?? finding.category}
              </Badge>
            </div>
            <p className="text-xs text-foreground-light pl-5">{finding.description}</p>
            {finding.recommendation && (
              <p className="text-xs text-foreground-light pl-5 italic">{finding.recommendation}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { type Lint, useProjectLintsQuery } from 'data/lint/lint-query'
import { AdvisorCenterTab, AdvisorSeverity, advisorCenterState } from 'state/advisor-center-state'
import { Badge, Button_Shadcn_ as Button } from 'ui'

const severityOrder: Record<AdvisorSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
}
const severityLabels: Record<AdvisorSeverity, string> = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
}

const lintSeverity = (lint: Lint): AdvisorSeverity => {
  switch (lint.level) {
    case 'ERROR':
      return 'critical'
    case 'WARN':
      return 'warning'
    default:
      return 'info'
  }
}

const severityBadgeVariants: Record<AdvisorSeverity, 'destructive' | 'warning' | 'default'> = {
  critical: 'destructive',
  warning: 'warning',
  info: 'default',
}

const lintTab = (lint: Lint): Exclude<AdvisorCenterTab, 'all'> | undefined => {
  const categories = lint.categories || []
  if (categories.includes('SECURITY') && !categories.includes('PERFORMANCE')) {
    return 'security'
  }
  if (categories.includes('PERFORMANCE') && !categories.includes('SECURITY')) {
    return 'performance'
  }
  if (categories.includes('SECURITY')) return 'security'
  if (categories.includes('PERFORMANCE')) return 'performance'
  return undefined
}

type AdvisorIssueToastProps = {
  id: string | number
  lint: Lint
  severity: AdvisorSeverity
  tab: Exclude<AdvisorCenterTab, 'all'>
}

const AdvisorIssueToast = ({ id, lint, severity, tab }: AdvisorIssueToastProps) => {
  const handleClick = () => {
    toast.dismiss(id)
    if (!lint.cache_key) return
    advisorCenterState.focusItem({
      id: lint.cache_key,
      tab,
    })
  }

  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      className="w-full text-left !block rounded-none h-auto py-3 px-4 space-y-3"
    >
      <div className="flex items-center gap-4">
        <h4 className="text-foreground heading-default flex-1 truncate">{lint.title}</h4>
        <Badge variant={severityBadgeVariants[severity]}>{severityLabels[severity]}</Badge>
      </div>
      <p className="text-foreground-light">{lint.detail}</p>
    </Button>
  )
}

export const useAdvisorIssueToasts = () => {
  const { ref: projectRef } = useParams()
  const { data: lints } = useProjectLintsQuery({ projectRef })

  const seenIdsRef = useRef<Set<string>>(new Set())
  const hasInitialSnapshotRef = useRef(false)

  useEffect(() => {
    seenIdsRef.current = new Set()
    hasInitialSnapshotRef.current = false
  }, [projectRef])

  useEffect(() => {
    if (!Array.isArray(lints) || lints.length === 0) return

    const lintsWithIds = lints.filter((lint) => typeof lint.cache_key === 'string')

    if (!hasInitialSnapshotRef.current) {
      lintsWithIds.forEach((lint) => {
        seenIdsRef.current.add(lint.cache_key!)
      })
      hasInitialSnapshotRef.current = true
      return
    }

    const newLints = lintsWithIds.filter((lint) => !seenIdsRef.current.has(lint.cache_key!))

    if (newLints.length === 0) return

    newLints
      .map((lint) => ({
        lint,
        severity: lintSeverity(lint),
        tab: lintTab(lint),
      }))
      .filter(
        (
          item
        ): item is {
          lint: Lint
          severity: AdvisorSeverity
          tab: Exclude<AdvisorCenterTab, 'all'>
        } => item.tab !== undefined
      )
      .filter((item) => item.severity !== 'info')
      .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
      .forEach(({ lint, severity, tab }) => {
        if (!lint.cache_key) return
        seenIdsRef.current.add(lint.cache_key)
        toast.custom(
          (id) => <AdvisorIssueToast id={id} lint={lint} severity={severity} tab={tab} />,
          {
            duration: 8000,
            position: 'top-right',
            className: '!p-0',
          }
        )
      })
  }, [lints])
}

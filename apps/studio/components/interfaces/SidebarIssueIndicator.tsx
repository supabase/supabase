import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { cn } from 'ui'

import { useProjectIssues } from '@/data/issues/useProjectIssues'
import { useLints } from '@/hooks/misc/useLints'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

export const SidebarIssueIndicator = ({ routeKey }: { routeKey: 'issues' | 'advisors' }) => {
  if (routeKey === 'issues') return <IssuesIndicator />
  return <AdvisorsIndicator />
}

const IssuesIndicator = () => {
  const { ref } = useParams()
  const { issues } = useProjectIssues({ projectRef: ref, runHealthChecks: false })
  const hasErrors = issues.some((issue) => issue.severity === 'critical')
  const hasWarnings = issues.some((issue) => issue.severity === 'warning')
  let status = ''
  if (hasErrors) status = 'Critical issues'
  else if (hasWarnings) status = 'Warning issues'

  return (
    <>
      <ActiveDot hasErrors={hasErrors} hasWarnings={hasWarnings} />
      <span className="sr-only" role="status">
        {status}
      </span>
    </>
  )
}

const AdvisorsIndicator = () => {
  const { securityLints, errorLints } = useLints()
  return <ActiveDot hasErrors={errorLints.length > 0} hasWarnings={securityLints.length > 0} />
}

const ActiveDot = ({ hasErrors, hasWarnings }: { hasErrors: boolean; hasWarnings: boolean }) => {
  const [sidebarBehaviour] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.SIDEBAR_BEHAVIOR, 'expandable')
  const isPersistentlyOpen = sidebarBehaviour === 'open'
  let color = 'bg-transparent'
  if (hasErrors) color = 'bg-destructive-600'
  else if (hasWarnings) color = 'bg-warning-600'

  return (
    <div
      aria-hidden="true"
      className={cn(
        'absolute pointer-events-none flex h-2 w-2 top-2 z-10 rounded-full',
        isPersistentlyOpen ? 'left-[20px]' : 'left-[18px]',
        color
      )}
    />
  )
}

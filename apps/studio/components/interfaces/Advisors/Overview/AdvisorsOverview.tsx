import { useParams } from 'common'
import { useIsAdvisorsV2Enabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { LINTER_LEVELS } from 'components/interfaces/Linter/Linter.constants'
import { lintInfoMap } from 'components/interfaces/Linter/Linter.utils'
import { useAdvisorAgentsQuery } from 'data/advisors/agents-query'
import { useAdvisorChannelsQuery } from 'data/advisors/channels-query'
import { useAdvisorIssuesQuery } from 'data/advisors/issues-query'
import { useAdvisorRulesQuery } from 'data/advisors/rules-query'
import type { AdvisorIssue } from 'data/advisors/types'
import { Lint, useProjectLintsQuery } from 'data/lint/lint-query'
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  BarChart,
  Bell,
  Bot,
  CheckCircle2,
  Info,
  RefreshCw,
  ScrollText,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { Badge, Button, Card, CardContent } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { QuickSetupCard } from './QuickSetupCard'

function HealthScoreBanner({
  issues,
  rulesCount,
  lintErrors,
  lintWarnings,
  isV2,
  projectRef,
}: {
  issues: AdvisorIssue[]
  rulesCount: number
  lintErrors: number
  lintWarnings: number
  isV2: boolean
  projectRef: string
}) {
  const critical = issues.filter(
    (i) => i.severity === 'critical' && ['open', 'acknowledged'].includes(i.status)
  )
  const warnings = issues.filter(
    (i) => i.severity === 'warning' && ['open', 'acknowledged'].includes(i.status)
  )

  const hasIssues = critical.length > 0 || warnings.length > 0
  const hasLints = lintErrors > 0 || lintWarnings > 0
  const totalProblems = critical.length + warnings.length + lintErrors + lintWarnings
  const hasRulesOrLints = rulesCount > 0 || (isV2 && hasLints)

  if (!hasRulesOrLints && !isV2) return null

  if (critical.length > 0 || lintErrors > 0) {
    const parts: string[] = []
    if (critical.length > 0)
      parts.push(`${critical.length} critical issue${critical.length !== 1 ? 's' : ''}`)
    if (lintErrors > 0) parts.push(`${lintErrors} lint error${lintErrors !== 1 ? 's' : ''}`)

    const extras: string[] = []
    if (warnings.length > 0)
      extras.push(`${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`)
    if (lintWarnings > 0)
      extras.push(`${lintWarnings} lint warning${lintWarnings !== 1 ? 's' : ''}`)

    return (
      <Card className="border-destructive-500/50 bg-destructive-200/10">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="rounded-full bg-destructive-200 p-2">
            <AlertOctagon className="h-5 w-5 text-destructive-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {parts.join(' and ')} need attention
            </p>
            <p className="text-xs text-foreground-lighter">
              {extras.length > 0 ? `Plus ${extras.join(' and ')}. ` : ''}
              Review the Security and Performance advisors to keep your project healthy.
            </p>
          </div>
          {hasIssues && (
            <Button
              asChild
              type="default"
              size="tiny"
              iconRight={<ArrowRight className="h-3 w-3" />}
            >
              <Link href={`/project/${projectRef}/advisors/issues`}>View issues</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  if (warnings.length > 0 || lintWarnings > 0) {
    return (
      <Card className="border-warning-500/50 bg-warning-200/10">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="rounded-full bg-warning-200 p-2">
            <AlertTriangle className="h-5 w-5 text-warning-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {hasIssues
                ? `${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`
                : `${lintWarnings} lint warning${lintWarnings !== 1 ? 's' : ''}`}
              {hasIssues && hasLints
                ? ` and ${lintWarnings} lint finding${lintWarnings !== 1 ? 's' : ''}`
                : ''}
            </p>
            <p className="text-xs text-foreground-lighter">
              No critical issues, but there are improvements to consider.
            </p>
          </div>
          {hasIssues && (
            <Button
              asChild
              type="default"
              size="tiny"
              iconRight={<ArrowRight className="h-3 w-3" />}
            >
              <Link href={`/project/${projectRef}/advisors/issues`}>View issues</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  if (totalProblems === 0 && hasRulesOrLints) {
    return (
      <Card className="border-brand-500/50 bg-brand-200/10">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="rounded-full bg-brand-200 p-2">
            <CheckCircle2 className="h-5 w-5 text-brand-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Your project looks healthy</p>
            <p className="text-xs text-foreground-lighter">
              {rulesCount > 0
                ? `${rulesCount} monitoring rule${rulesCount !== 1 ? 's' : ''} active. `
                : ''}
              No issues detected.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}

function ActiveIssuesSummary({
  issues,
  projectRef,
}: {
  issues: AdvisorIssue[]
  projectRef: string
}) {
  const active = issues
    .filter((i) => ['open', 'acknowledged', 'snoozed'].includes(i.status))
    .sort((a, b) => {
      const sevOrder = { critical: 0, warning: 1, info: 2 }
      return (sevOrder[a.severity] ?? 2) - (sevOrder[b.severity] ?? 2)
    })
    .slice(0, 5)

  if (active.length === 0) return null

  const sevConfig = {
    critical: { icon: AlertOctagon, color: 'text-destructive-600', bg: 'bg-destructive-200' },
    warning: { icon: AlertTriangle, color: 'text-warning-600', bg: 'bg-warning-200' },
    info: { icon: Info, color: 'text-foreground-lighter', bg: 'bg-surface-200' },
  } as const

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Active Issues</h3>
        <Button asChild type="text" size="tiny" iconRight={<ArrowRight className="h-3 w-3" />}>
          <Link href={`/project/${projectRef}/advisors/issues`}>View all</Link>
        </Button>
      </div>
      <div className="grid gap-2">
        {active.map((issue) => {
          const sev = sevConfig[issue.severity] ?? sevConfig.info
          const SevIcon = sev.icon
          return (
            <Card key={issue.id}>
              <CardContent className="flex items-center gap-3 p-3">
                <div className={`rounded-full p-1.5 ${sev.bg} shrink-0`}>
                  <SevIcon className={`h-3.5 w-3.5 ${sev.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/project/${projectRef}/advisors/issues/${issue.id}`}
                    className="text-sm font-medium text-foreground hover:underline"
                  >
                    {issue.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge
                      variant={
                        issue.severity === 'critical'
                          ? 'destructive'
                          : issue.severity === 'warning'
                            ? 'warning'
                            : 'default'
                      }
                    >
                      {issue.severity}
                    </Badge>
                    <span className="text-xs text-foreground-lighter capitalize">
                      {issue.category}
                    </span>
                    <span className="text-xs text-foreground-muted">
                      {issue.alert_count} alert{issue.alert_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <Button asChild type="outline" size="tiny">
                  <Link href={`/project/${projectRef}/advisors/issues/${issue.id}`}>Details</Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function StatsCards({
  issueCount,
  rulesCount,
  agentsCount,
  channelsCount,
  lintFindingsCount,
  projectRef,
  isV2,
}: {
  issueCount: number
  rulesCount: number
  agentsCount: number
  channelsCount: number
  lintFindingsCount: number
  projectRef: string
  isV2: boolean
}) {
  const stats = [
    {
      label: 'Open Issues',
      value: issueCount,
      icon: ShieldAlert,
      href: `/project/${projectRef}/advisors/issues`,
      accent: issueCount > 0 ? 'text-warning-600' : 'text-foreground-lighter',
    },
    ...(isV2
      ? [
          {
            label: 'Lint Findings',
            value: lintFindingsCount,
            icon: Shield,
            href: `/project/${projectRef}/advisors/security`,
            accent: lintFindingsCount > 0 ? 'text-warning-600' : 'text-foreground-lighter',
          },
        ]
      : []),
    {
      label: 'Rules',
      value: rulesCount,
      icon: ScrollText,
      href: `/project/${projectRef}/advisors/monitoring-rules`,
      accent: 'text-foreground-lighter',
    },
    {
      label: 'Agents',
      value: agentsCount,
      icon: Bot,
      href: `/project/${projectRef}/advisors/agents`,
      accent: 'text-foreground-lighter',
    },
    {
      label: 'Notifications',
      value: channelsCount,
      icon: Bell,
      href: `/project/${projectRef}/advisors/channels`,
      accent: 'text-foreground-lighter',
    },
  ]

  return (
    <div className={`grid grid-cols-2 ${isV2 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-3`}>
      {stats.map((stat) => {
        const Icon = stat.icon
        const content = (
          <Card className={stat.href ? 'hover:border-foreground-muted transition-colors' : ''}>
            <CardContent className="flex items-center gap-3 p-4">
              <Icon className={`h-5 w-5 shrink-0 ${stat.accent}`} />
              <div>
                <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                <p className="text-xs text-foreground-lighter">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        )
        if (stat.href) {
          return (
            <Link key={stat.label} href={stat.href}>
              {content}
            </Link>
          )
        }
        return <div key={stat.label}>{content}</div>
      })}
    </div>
  )
}

function LintFindingsSummary({
  lints,
  projectRef,
  refetchLints,
  isRefetching,
}: {
  lints: Lint[]
  projectRef: string
  refetchLints: () => void
  isRefetching: boolean
}) {
  const errors = lints.filter((l) => l.level === LINTER_LEVELS.ERROR)
  const warnings = lints.filter((l) => l.level === LINTER_LEVELS.WARN)
  const infos = lints.filter((l) => l.level === LINTER_LEVELS.INFO)

  if (lints.length === 0) return null

  const levConfig = {
    [LINTER_LEVELS.ERROR]: {
      icon: AlertOctagon,
      color: 'text-destructive-600',
      bg: 'bg-destructive-200',
      label: 'Error',
    },
    [LINTER_LEVELS.WARN]: {
      icon: AlertTriangle,
      color: 'text-warning-600',
      bg: 'bg-warning-200',
      label: 'Warning',
    },
    [LINTER_LEVELS.INFO]: {
      icon: Info,
      color: 'text-foreground-lighter',
      bg: 'bg-surface-200',
      label: 'Info',
    },
  } as const

  const grouped = new Map<string, { lint: Lint; info: (typeof lintInfoMap)[number] | undefined }>()
  for (const lint of [...errors, ...warnings, ...infos].slice(0, 10)) {
    if (!grouped.has(lint.name)) {
      grouped.set(lint.name, { lint, info: lintInfoMap.find((i) => i.name === lint.name) })
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          Lint Findings
          <span className="text-foreground-lighter ml-2 font-normal">
            {errors.length > 0 && (
              <Badge variant="destructive" className="mr-1">
                {errors.length} error{errors.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {warnings.length > 0 && (
              <Badge variant="warning" className="mr-1">
                {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {infos.length > 0 && <Badge variant="default">{infos.length} info</Badge>}
          </span>
        </h3>
        <Button
          type="text"
          size="tiny"
          icon={<RefreshCw className={`h-3 w-3 ${isRefetching ? 'animate-spin' : ''}`} />}
          onClick={refetchLints}
          disabled={isRefetching}
        >
          Re-run checks
        </Button>
      </div>
      <div className="grid gap-2">
        {Array.from(grouped.values()).map(({ lint, info }) => {
          const lev = levConfig[lint.level as LINTER_LEVELS] ?? levConfig[LINTER_LEVELS.INFO]
          const LevIcon = lev.icon
          const isSecurity = lint.categories.includes('SECURITY')
          const CategoryIcon = isSecurity ? Shield : BarChart
          const detailHref = `/project/${projectRef}/advisors/${isSecurity ? 'security' : 'performance'}?preset=${lint.level}&id=${lint.cache_key}`
          return (
            <Link key={lint.cache_key} href={detailHref}>
              <Card className="hover:border-foreground-muted transition-colors">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className={`rounded-full p-1.5 ${lev.bg} shrink-0`}>
                    <LevIcon className={`h-3.5 w-3.5 ${lev.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {info?.title ?? lint.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant={
                          lint.level === LINTER_LEVELS.ERROR
                            ? 'destructive'
                            : lint.level === LINTER_LEVELS.WARN
                              ? 'warning'
                              : 'default'
                        }
                      >
                        {lev.label}
                      </Badge>
                      <span className="text-xs text-foreground-lighter flex items-center gap-1">
                        <CategoryIcon className="h-3 w-3" />
                        {lint.categories[0]}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-foreground-lighter shrink-0" />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function QuickLinks({ projectRef }: { projectRef: string }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">Run Checks</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Link href={`/project/${projectRef}/advisors/security`}>
          <Card className="hover:border-foreground-muted transition-colors h-full">
            <CardContent className="flex items-start gap-3 p-4">
              <ShieldCheck className="h-5 w-5 text-foreground-lighter shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Security Advisor</p>
                <p className="text-xs text-foreground-lighter">
                  Check for common security misconfigurations
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/project/${projectRef}/advisors/performance`}>
          <Card className="hover:border-foreground-muted transition-colors h-full">
            <CardContent className="flex items-start gap-3 p-4">
              <Zap className="h-5 w-5 text-foreground-lighter shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Performance Advisor</p>
                <p className="text-xs text-foreground-lighter">Identify performance bottlenecks</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

export function AdvisorsOverview() {
  const { ref: projectRef } = useParams()
  const isV2 = useIsAdvisorsV2Enabled()

  const { data: issues, isLoading: issuesLoading } = useAdvisorIssuesQuery(projectRef)
  const { data: rules, isLoading: rulesLoading } = useAdvisorRulesQuery(projectRef)
  const { data: agents } = useAdvisorAgentsQuery(projectRef)
  const { data: channels } = useAdvisorChannelsQuery(projectRef)

  const {
    data: lints,
    isPending: lintsLoading,
    isRefetching: lintsRefetching,
    refetch: refetchLints,
  } = useProjectLintsQuery({ projectRef }, { enabled: !!isV2 })

  const isLoading = issuesLoading || rulesLoading || (isV2 && lintsLoading)

  if (isLoading) return <GenericSkeletonLoader />

  const allIssues = issues ?? []
  const allRules = rules ?? []
  const allLints = lints ?? []
  const activeIssueCount = allIssues.filter((i) =>
    ['open', 'acknowledged', 'snoozed'].includes(i.status)
  ).length

  const lintErrors = allLints.filter((l) => l.level === LINTER_LEVELS.ERROR).length
  const lintWarnings = allLints.filter((l) => l.level === LINTER_LEVELS.WARN).length
  const lintFindingsCount = lintErrors + lintWarnings

  const showOnboarding = allRules.length === 0 && (!isV2 || allLints.length === 0)

  if (showOnboarding) {
    return (
      <div className="flex flex-col gap-y-6">
        <QuickSetupCard projectRef={projectRef!} />
        <QuickLinks projectRef={projectRef!} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-6">
      <HealthScoreBanner
        issues={allIssues}
        rulesCount={allRules.length}
        lintErrors={lintErrors}
        lintWarnings={lintWarnings}
        isV2={!!isV2}
        projectRef={projectRef!}
      />

      <StatsCards
        issueCount={activeIssueCount}
        rulesCount={allRules.length}
        agentsCount={(agents ?? []).length}
        channelsCount={(channels ?? []).length}
        lintFindingsCount={lintFindingsCount}
        projectRef={projectRef!}
        isV2={!!isV2}
      />

      <ActiveIssuesSummary issues={allIssues} projectRef={projectRef!} />

      {isV2 && allLints.length > 0 && (
        <div id="lint-findings">
          <p className="text-xs text-foreground-lighter mb-3">
            Lint findings are real-time checks from the Security and Performance Advisors. Click a
            finding to see full details and remediation steps.
          </p>
          <LintFindingsSummary
            lints={allLints}
            projectRef={projectRef!}
            refetchLints={refetchLints}
            isRefetching={lintsRefetching}
          />
        </div>
      )}

      <QuickLinks projectRef={projectRef!} />
    </div>
  )
}

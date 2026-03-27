'use client'

import { RouteParamsOverrideProvider } from 'common'
import { LINTER_LEVELS } from 'components/interfaces/Linter/Linter.constants'
import {
  applyDemoInfrastructureIfUnreliable,
  parseConnectionsData,
  parseInfrastructureMetrics,
} from 'components/interfaces/Observability/DatabaseInfrastructureSection.utils'
import { ProjectUsageSection } from 'components/interfaces/ProjectHome/ProjectUsageSection'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useInfraMonitoringAttributesQuery } from 'data/analytics/infra-monitoring-query'
import type { InfraMonitoringAttribute } from 'data/analytics/infra-monitoring-query'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useProjectApiUrl } from 'data/config/project-endpoint-query'
import { useBackupsQuery } from 'data/database/backups-query'
import { useMaxConnectionsQuery } from 'data/database/max-connections-query'
import { useMigrationsQuery } from 'data/database/migrations-query'
import { useProjectLintsQuery as useLints } from 'data/lint/lint-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import dayjs from 'dayjs'
import { IS_PLATFORM } from 'lib/constants'
import { AlertTriangle, Archive, CircleAlert, Database, GitBranch, Info, Plug } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useMemo } from 'react'
import { useAdvisorStateSnapshot } from 'state/advisor-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { Badge, Button, cn } from 'ui'
import { TimestampInfo } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'

import { HomeViewDataCountersRow } from './HomeViewDataCountersRow'
import { HomeViewServiceStatusCard } from './HomeViewServiceStatusCard'
import { HomeViewSupaAiSummary } from './HomeViewSupaAiSummary'
import { getMockHomeSummaryData, HOME_SUPA_AI_SUMMARY_USE_MOCK } from './homeViewSupaAiSummaryMock'
import { useV2DataCounts } from './useV2DataCounts'
import { useV2Params } from '@/app/v2/V2ParamsContext'

const HomeViewInfrastructureDiagram = dynamic(
  () => import('./HomeViewInfrastructureDiagram').then((m) => m.HomeViewInfrastructureDiagram),
  {
    ssr: false,
    loading: () => (
      <div className="h-full min-h-[200px] animate-pulse rounded-md bg-surface-200" aria-hidden />
    ),
  }
)

function LintSeverityIcon({ level }: { level: string }) {
  const iconClass = 'size-4 shrink-0'
  const aria =
    level === LINTER_LEVELS.ERROR
      ? 'Error'
      : level === LINTER_LEVELS.WARN
        ? 'Warning'
        : 'Information'

  return (
    <span
      role="img"
      className="shrink-0 flex items-center justify-center"
      title={level}
      aria-label={`${aria} severity`}
    >
      {level === LINTER_LEVELS.ERROR ? (
        <CircleAlert className={cn(iconClass, 'text-destructive')} strokeWidth={1.5} aria-hidden />
      ) : level === LINTER_LEVELS.WARN ? (
        <AlertTriangle
          className={cn(iconClass, 'text-warning-600 dark:text-warning')}
          strokeWidth={1.5}
          aria-hidden
        />
      ) : (
        <Info className={cn(iconClass, 'text-foreground-lighter')} strokeWidth={1.5} aria-hidden />
      )}
    </span>
  )
}

function maskConnectionString(conn: string | null | undefined) {
  if (!conn) return ''
  // Try to mask `user:password@` parts.
  const match = conn.match(/^(.*:\/\/)([^:]+):([^@]+)(@.*)$/)
  if (match) {
    return `${match[1]}${match[2]}:****${match[4]}`
  }
  // Fallback: mask everything after first ':' before '@'
  return conn.replace(/:(.*)@/, ':****@')
}

export function HomeView() {
  const { projectRef, orgSlug } = useV2Params()

  const { data: project, isPending: isProjectDetailPending } = useProjectDetailQuery(
    { ref: projectRef },
    { enabled: Boolean(projectRef) }
  )

  const { data: organizations = [], isPending: isOrganizationsPending } = useOrganizationsQuery({
    enabled: Boolean(projectRef),
  })
  const organization = useMemo(() => {
    if (orgSlug) return organizations.find((o) => o.slug === orgSlug)
    if (project?.organization_id) {
      return organizations.find((o) => o.id === project.organization_id)
    }
    return undefined
  }, [orgSlug, organizations, project?.organization_id])

  /** Context org slug can lag behind project load; API needs slug for hosted org gate. */
  const homeSummaryOrgSlug = orgSlug ?? organization?.slug

  const parentRef = project?.parent_project_ref ?? projectRef
  const { data: branches } = useBranchesQuery(
    { projectRef: parentRef },
    { enabled: Boolean(parentRef) && IS_PLATFORM }
  )

  const mainBranch = branches?.find((b) => b.is_default)
  const currentBranch = branches?.find((b) => b.project_ref === projectRef)
  const isDefaultProject = project?.parent_project_ref === undefined
  const latestNonDefaultBranch = useMemo(() => {
    const list = (branches ?? []).filter((b) => !b.is_default)
    if (list.length === 0) return undefined
    return list
      .slice()
      .sort(
        (a, b) =>
          new Date(b.created_at ?? b.updated_at).valueOf() -
          new Date(a.created_at ?? a.updated_at).valueOf()
      )[0]
  }, [branches])
  const branchName = currentBranch?.name ?? mainBranch?.name ?? 'main'
  const branchBadge = currentBranch?.is_default ? 'prod' : 'preview'

  const lintsQuery = useLints({ projectRef })
  const lints = lintsQuery.data ?? []
  const issues = lints.slice(0, 6)

  const now = dayjs()
  const startDate = now.subtract(1, 'day').toISOString()
  const endDate = now.toISOString()

  const attributes = useMemo<InfraMonitoringAttribute[]>(
    () => [
      'avg_cpu_usage',
      'ram_usage',
      'disk_fs_used_system',
      'disk_fs_used_wal',
      'pg_database_size',
      'disk_fs_size',
      'disk_io_consumption',
      'pg_stat_database_num_backends',
    ],
    []
  )

  const { data: infraData } = useInfraMonitoringAttributesQuery(
    {
      projectRef,
      attributes,
      startDate,
      endDate,
      interval: '1h',
    },
    { enabled: Boolean(projectRef) }
  )

  const { data: maxConnectionsData } = useMaxConnectionsQuery({
    projectRef,
    connectionString: project?.connectionString,
  })
  const { data: migrationsData = [], isPending: isLoadingMigrations } = useMigrationsQuery({
    projectRef,
    connectionString: project?.connectionString,
  })
  const latestMigration = useMemo(() => migrationsData[0], [migrationsData])
  const migrationLabelText =
    migrationsData.length === 0 ? 'No migrations' : (latestMigration?.name ?? 'Unknown')

  const { data: backupsData, isPending: isLoadingBackups } = useBackupsQuery({ projectRef })
  const latestBackup = useMemo(() => {
    const list = backupsData?.backups ?? []
    if (list.length === 0) return undefined
    return list
      .slice()
      .sort((a, b) => new Date(b.inserted_at).valueOf() - new Date(a.inserted_at).valueOf())[0]
  }, [backupsData])
  const counts = useV2DataCounts(projectRef)

  const rawMetrics = parseInfrastructureMetrics(infraData)
  const rawConnections = parseConnectionsData(infraData, maxConnectionsData)
  const { metrics, connections } = applyDemoInfrastructureIfUnreliable(
    infraData,
    rawMetrics,
    rawConnections
  )

  const mockHomeSummary = useMemo(
    () => (HOME_SUPA_AI_SUMMARY_USE_MOCK && projectRef ? getMockHomeSummaryData() : null),
    [projectRef]
  )
  const summaryLints = mockHomeSummary?.lints ?? lints
  const summaryMetrics = mockHomeSummary?.metrics ?? metrics
  const summaryConnections = mockHomeSummary?.connections ?? connections
  const summaryLintsPending = mockHomeSummary ? false : lintsQuery.isLoading
  const summaryUsesMockData = Boolean(mockHomeSummary)

  const { openSidebar } = useSidebarManagerSnapshot()
  const { setSelectedItem } = useAdvisorStateSnapshot()

  const handleOpenLint = (lint: (typeof issues)[number]) => {
    if (!projectRef) return
    setSelectedItem(lint.cache_key, 'lint')
    openSidebar(SIDEBAR_KEYS.ADVISOR_PANEL)
  }

  const [, setShowConnect] = useQueryState('showConnect', parseAsBoolean.withDefault(false))
  const { data: projectApiUrl } = useProjectApiUrl({ projectRef }, { enabled: Boolean(projectRef) })
  const { data: apiKeys } = useAPIKeysQuery(
    { projectRef, reveal: false },
    { enabled: Boolean(projectRef) }
  )
  const { publishableKey } = getKeys(apiKeys)

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 p-4">
      {/* a) Project header */}
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="text-3xl font-semibold truncate">{project?.name ?? 'Project'}</div>
          <div className="text-sm text-foreground-lighter truncate">
            {organization?.name ?? orgSlug ?? ''}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Badge variant="success">{branchName}</Badge>
            <Badge variant={branchBadge === 'prod' ? 'success' : 'default'}>{branchBadge}</Badge>
          </div>
          <div className="text-xs text-foreground-lighter whitespace-nowrap">
            {project?.region ? `${project.region} / ` : ''}
            {project?.infra_compute_size ? `${project.infra_compute_size} / ` : ''}
            {project?.dbVersion ? `PG ${project.dbVersion}` : 'Postgres —'}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-3">
        {/* Infrastructure diagram */}
        <div className="h-[280px] lg:col-span-2">
          <div className="h-full border border-muted rounded-md overflow-hidden flex flex-col">
            <HomeViewInfrastructureDiagram />
          </div>
        </div>

        {/* Compact activity + metrics */}
        <div className="flex flex-col gap-3">
          <HomeViewSupaAiSummary
            className="flex-1"
            projectRef={projectRef}
            projectName={project?.name}
            projectStatus={project?.status}
            orgSlug={homeSummaryOrgSlug}
            projectDetailPending={Boolean(projectRef) && isProjectDetailPending}
            organizationsPending={Boolean(projectRef) && IS_PLATFORM && isOrganizationsPending}
            lints={summaryLints}
            lintsPending={summaryLintsPending}
            metrics={summaryMetrics}
            connections={summaryConnections}
            counts={counts}
            migrationLabel={migrationLabelText}
            usesMockData={summaryUsesMockData}
          />
        </div>
      </div>

      <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-2">
        <HomeViewServiceStatusCard projectRef={projectRef} project={project} />
        <Link
          href={
            projectRef ? `/v2/project/${projectRef}/data/tables?schema=supabase_migrations` : '#'
          }
          className="border border-border bg-surface-100 rounded-md p-2 hover:bg-sidebar-accent/50 transition-colors"
        >
          <div className="text-xs text-foreground-lighter flex items-center gap-1.5">
            <Database size={12} strokeWidth={1.5} />
            <span>Last migration</span>
          </div>
          <div className="text-xs mt-1 truncate" title={migrationLabelText}>
            {isLoadingMigrations ? 'Loading...' : migrationLabelText}
          </div>
        </Link>
        <Link
          href={projectRef ? `/v2/project/${projectRef}/settings/backups` : '#'}
          className="border border-border bg-surface-100 rounded-md p-2 hover:bg-sidebar-accent/50 transition-colors"
        >
          <div className="text-xs text-foreground-lighter flex items-center gap-1.5">
            <Archive size={12} strokeWidth={1.5} />
            <span>Last backup</span>
          </div>
          <div className="text-xs mt-1">
            {isLoadingBackups ? (
              'Loading...'
            ) : backupsData?.pitr_enabled ? (
              'PITR enabled'
            ) : latestBackup ? (
              <TimestampInfo
                className="text-xs"
                displayAs="utc"
                label={dayjs(latestBackup.inserted_at).fromNow()}
                utcTimestamp={latestBackup.inserted_at}
              />
            ) : (
              'No backups'
            )}
          </div>
        </Link>
        <Link
          href={projectRef ? `/v2/project/${projectRef}/data/branches` : '#'}
          className="border border-border bg-surface-100 rounded-md p-2 hover:bg-sidebar-accent/50 transition-colors"
        >
          <div className="text-xs text-foreground-lighter flex items-center gap-1.5">
            <GitBranch size={12} strokeWidth={1.5} />
            <span>{isDefaultProject ? 'Recent branch' : 'Branch created'}</span>
          </div>
          <div className="text-xs mt-1 truncate">
            {isDefaultProject ? (
              <span title={latestNonDefaultBranch?.name ?? 'No branches'}>
                {latestNonDefaultBranch?.name ?? 'No branches'}
              </span>
            ) : currentBranch?.created_at ? (
              <TimestampInfo
                className="text-xs"
                label={dayjs(currentBranch.created_at).fromNow()}
                utcTimestamp={currentBranch.created_at}
              />
            ) : (
              'Unknown'
            )}
          </div>
        </Link>
      </div>

      <HomeViewDataCountersRow projectRef={projectRef} counts={counts} />

      <div className="w-full grid lg:grid-cols-2 gap-3">
        {/* Connect */}
        <div className="">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h2 className="text-base">Connect to your project</h2>
            <Button
              type="text"
              size="tiny"
              onClick={() => setShowConnect(true)}
              icon={<Plug className="rotate-90" />}
            >
              Connect
            </Button>
          </div>
          <div className="border border-border bg-surface-100 rounded-md p-2 space-y-2">
            <div>
              <div className="text-xs text-foreground-lighter mb-1">Project URL</div>
              <Input
                copy
                readOnly
                value={projectApiUrl ?? ''}
                placeholder="Project URL unavailable"
                className="font-mono text-xs"
              />
            </div>
            <div>
              <div className="text-xs text-foreground-lighter mb-1">Publishable key</div>
              <Input
                copy
                readOnly
                value={publishableKey?.api_key ?? ''}
                placeholder="Publishable key unavailable"
                className="font-mono text-xs"
              />
            </div>
            <div>
              <div className="text-xs text-foreground-lighter mb-1">Connection string</div>
              <Input
                copy
                readOnly
                value={maskConnectionString(project?.connectionString)}
                placeholder="Connection string unavailable"
                className="font-mono text-xs"
              />
            </div>
          </div>
        </div>
        {/* Active issues */}
        <div className="max-w-full h-full max-h-[230px] overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base ">Active issues</h2>
            <span className="text-xs text-foreground-lighter">{issues.length} shown</span>
          </div>
          {lintsQuery.isPending ? (
            <div className="text-sm text-foreground-lighter">Loading issues…</div>
          ) : issues.length === 0 ? (
            <div className="text-sm text-foreground-lighter rounded border border-border p-3">
              No issues detected
            </div>
          ) : (
            <div className="overflow-hidden overflow-y-auto max-h-full pb-8">
              <div className="space-y-1">
                {issues.map((lint) => {
                  const pillStyle =
                    lint.level === LINTER_LEVELS.ERROR &&
                    'bg-destructive-200 border-destructive-500 text-destructive hover:bg-destructive-400/50'
                  return (
                    <button
                      key={lint.cache_key}
                      type="button"
                      onClick={() => handleOpenLint(lint)}
                      className={cn(
                        'w-full text-left flex items-start gap-3 rounded border border-border bg-surface-100 hover:bg-sidebar-accent/50 p-2',
                        pillStyle
                      )}
                    >
                      <LintSeverityIcon level={lint.level} />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs  text-foreground truncate">
                          {lint.categories?.[0] ?? 'General'}
                        </div>
                        <div className="text-xs text-foreground-lighter truncate">
                          {lint.description ?? lint.detail}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {IS_PLATFORM && Boolean(projectRef) && (
        <RouteParamsOverrideProvider value={{ ref: projectRef }}>
          <ProjectUsageSection />
        </RouteParamsOverrideProvider>
      )}
    </div>
  )
}

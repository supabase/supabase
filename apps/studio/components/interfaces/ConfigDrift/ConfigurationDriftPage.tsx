import { useParams } from 'common'
import { BucketPlus } from 'icons'
import { ArrowRight, CheckCircle2, FileWarning, Github, Minus, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button, Card, Skeleton } from 'ui'
import { CollapsibleCardSection } from 'ui-patterns/CollapsibleCardSection'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

import {
  createConfigurationDriftRows,
  groupUnmanagedConfigFields,
  type ConfigurationDriftRow,
  type UnmanagedConfigSectionGroup,
} from './ConfigurationDriftPage.utils'
import { AlertError } from '@/components/ui/AlertError'
import { useSelectedGitHubConfigDrift } from '@/hooks/misc/useGitHubConfigDrift'

export function ConfigurationDriftPageSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading configuration drift" aria-busy="true">
      <div className="space-y-3 rounded-lg border border-border bg-surface-100 px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
            <Skeleton className="h-4 w-44 max-w-[60vw]" />
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Skeleton className="h-7 flex-1 rounded-md sm:w-28 sm:flex-none" />
            <Skeleton className="h-7 flex-1 rounded-md sm:w-20 sm:flex-none" />
          </div>
        </div>

        <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-3">
          {['w-28', 'w-44', 'w-52'].map((width) => (
            <div key={width} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className={`h-3 ${width}`} />
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-3">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-2 h-3 w-72 max-w-full" />
          <div className="mt-3 overflow-hidden rounded-md border border-border">
            <div className="flex items-center gap-2 bg-surface-100 px-3 py-2.5">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="space-y-2 border-t border-border bg-[#0d0d0d] px-4 py-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-52 max-w-full" />
              <Skeleton className="h-3 w-40 max-w-full" />
            </div>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex min-h-[77px] items-start gap-3 border-b border-border px-4 py-4 sm:px-5">
          <Skeleton className="mt-0.5 h-5 w-5 shrink-0 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48 max-w-full" />
            <Skeleton className="h-3 w-[460px] max-w-full" />
          </div>
        </div>

        <div className="border-b border-border bg-surface-100 px-4 py-3 sm:px-5">
          <Skeleton className="h-3 w-32" />
        </div>

        <div className="px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-52 max-w-[55vw]" />
            </div>
            <Skeleton className="h-7 w-24 shrink-0 rounded-md" />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[0, 1].map((panel) => (
              <div
                key={panel}
                className="min-h-[84px] space-y-3 rounded-md border border-border p-3"
              >
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border bg-surface-100 px-4 py-4 sm:flex-row sm:px-5">
          <Skeleton className="h-[58px] flex-1 rounded-md" />
          <Skeleton className="h-[58px] flex-1 rounded-md" />
        </div>
      </Card>
    </div>
  )
}

function ConfigurationValuePanel({
  label,
  values,
  kind,
}: {
  label: string
  values: string[]
  kind: 'dashboard' | 'config'
}) {
  const Icon = kind === 'dashboard' ? Minus : Plus

  return (
    <div className="min-w-0 rounded-md border border-border bg-surface-100 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground-light">
        <Icon
          className={kind === 'dashboard' ? 'h-3.5 w-3.5 text-warning' : 'h-3.5 w-3.5 text-brand'}
        />
        <span>{label}</span>
      </div>
      <ul className="space-y-1.5">
        {values.map((value) => (
          <li key={value} className="break-all font-mono text-xs leading-5 text-foreground">
            {value}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ConfigurationDriftItem({ row }: { row: ConfigurationDriftRow }) {
  const valueDiff = row.valueDiff
  const listDifferenceCount =
    valueDiff.kind === 'list'
      ? Number(valueDiff.onlyInDashboard.length > 0) + Number(valueDiff.onlyInConfig.length > 0)
      : 0

  return (
    <article className="border-t border-border px-4 py-4 first:border-t-0 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
          <h3 className="text-sm font-medium text-foreground">{row.settingLabel}</h3>
          <code className="text-code-inline max-w-full truncate text-xs" title={row.configPath}>
            {row.configPath}
          </code>
          <span className="text-xs text-warning">Drift</span>
        </div>
        <Button
          asChild
          type="button"
          variant="default"
          size="tiny"
          className="w-full shrink-0 sm:w-auto"
          icon={<ArrowRight className="h-3.5 w-3.5" />}
        >
          <Link href={row.settingHref}>Open setting</Link>
        </Button>
      </div>

      {valueDiff.kind === 'list' ? (
        <div
          className={`mt-4 grid gap-3 ${listDifferenceCount > 1 ? 'md:grid-cols-2' : 'grid-cols-1'}`}
        >
          {valueDiff.onlyInDashboard.length > 0 && (
            <ConfigurationValuePanel
              label="Only in current environment"
              values={valueDiff.onlyInDashboard}
              kind="dashboard"
            />
          )}
          {valueDiff.onlyInConfig.length > 0 && (
            <ConfigurationValuePanel
              label="Only in config.toml"
              values={valueDiff.onlyInConfig}
              kind="config"
            />
          )}
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="min-w-0 rounded-md border border-border bg-surface-100 p-3">
            <p className="mb-2 text-xs font-medium text-foreground-light">
              Current environment · active
            </p>
            <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-5 text-foreground">
              {valueDiff.dashboardValue}
            </pre>
          </div>
          <div className="min-w-0 rounded-md border border-border bg-surface-100 p-3">
            <p className="mb-2 text-xs font-medium text-foreground-light">config.toml · intended</p>
            <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-5 text-foreground">
              {valueDiff.configValue}
            </pre>
          </div>
        </div>
      )}
    </article>
  )
}

export function ConfigurationDriftResults({ rows }: { rows: ConfigurationDriftRow[] }) {
  const driftCount = rows.length
  const issueSummary = `${driftCount} ${driftCount === 1 ? 'setting differs' : 'settings differ'}`

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-3 border-b border-border px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <FileWarning className="mt-0.5 h-5 w-5 shrink-0 -translate-x-0.5 text-warning" />
          <div className="min-w-0">
            <h2 className="text-sm font-medium">{issueSummary}</h2>
            <p className="mt-1 text-sm text-foreground-light">
              Current environment values differ from config.toml. Update the setting to resolve.
            </p>
          </div>
        </div>
      </div>

      <div>
        {rows.map((row) => (
          <ConfigurationDriftItem key={row.configPath} row={row} />
        ))}
      </div>
    </Card>
  )
}

function UnmanagedConfigSection({ groups }: { groups: UnmanagedConfigSectionGroup[] }) {
  const fieldCount = groups.reduce((count, group) => count + group.rows.length, 0)
  if (fieldCount === 0) return null

  return (
    <Card className="px-4 py-4 sm:px-5">
      <CollapsibleCardSection
        title={`Not tracked in config.toml (${fieldCount})`}
        description="These settings aren't declared in config.toml, so they can't drift — shown here for visibility only."
      >
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.section}>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                {group.sectionLabel}
              </h3>
              <ul className="divide-y divide-border rounded-md border border-border">
                {group.rows.map((row) => (
                  <li
                    key={row.configPath}
                    className="flex items-center justify-between gap-4 px-3 py-2 text-sm"
                  >
                    <span className="text-foreground-light">{row.label}</span>
                    <code
                      className="max-w-[60%] truncate text-xs text-foreground-muted"
                      title={row.value}
                    >
                      {row.value}
                    </code>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CollapsibleCardSection>
    </Card>
  )
}

export function ConfigurationDriftPage() {
  const { ref: projectRef = '' } = useParams()
  const { summary, unmanagedFields, isReady, isPending, isFetching, isError, error, refetch } =
    useSelectedGitHubConfigDrift()
  const driftRows = createConfigurationDriftRows(summary.driftedFields, projectRef)
  const comparableSettingCount = summary.managedCount + driftRows.length
  const unmanagedGroups = groupUnmanagedConfigFields(unmanagedFields)

  if (isPending) {
    return <ConfigurationDriftPageSkeleton />
  }

  if (isError) {
    return (
      <AlertError
        projectRef={projectRef}
        subject="Could not check configuration drift"
        description="Refresh to compare the supported settings with the selected GitHub branch again."
        error={error}
        additionalActions={
          <Button variant="default" size="small" loading={isFetching} onClick={() => refetch()}>
            Refresh
          </Button>
        }
      />
    )
  }

  if (!isReady) {
    return (
      <EmptyStatePresentational
        icon={Github}
        title="Github integration required"
        description={
          <p className="mt-1 text-sm text-foreground-light">
            This feature requires a GitHub integration to enable the project to be managed by a
            config.toml file.
          </p>
        }
      >
        <Link href={`/project/${projectRef}/settings/integrations`}>
          <Button size="tiny" variant="primary" icon={<Plus size={14} />}>
            Connect a GitHub repo
          </Button>
        </Link>
      </EmptyStatePresentational>
    )
  }

  return (
    <main className="space-y-6">
      {comparableSettingCount === 0 ? (
        <Card className="flex min-h-44 items-center justify-center px-6 text-center">
          <div className="max-w-lg">
            <Github className="mx-auto mb-3 h-6 w-6 text-foreground-muted" />
            <h2 className="text-sm font-medium">No comparable settings found</h2>
            <p className="mt-1 text-sm text-foreground-light">
              This branch does not define any supported, non-secret settings that can be compared
              with the current environment.
            </p>
          </div>
        </Card>
      ) : driftRows.length === 0 ? (
        <Card className="flex min-h-44 items-center justify-center px-6 text-center">
          <div className="max-w-lg">
            <CheckCircle2 className="mx-auto mb-3 h-6 w-6 text-brand" />
            <h2 className="text-sm font-medium">All compared settings match</h2>
            <p className="mt-1 text-sm text-foreground-light">
              The current environment matches all {summary.managedCount} comparable settings in this
              branch.
            </p>
          </div>
        </Card>
      ) : (
        <ConfigurationDriftResults rows={driftRows} />
      )}

      <UnmanagedConfigSection groups={unmanagedGroups} />
    </main>
  )
}

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileCode2,
  FileWarning,
  Github,
  GitPullRequest,
  Minus,
  MoreHorizontal,
  Plus,
  RotateCcw,
} from 'lucide-react'
import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Skeleton,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { createAuthConfigRestorePayloads } from './ConfigurationDriftPage.actions'
import {
  createConfigurationDriftRows,
  formatAuthConfigValue,
  type ConfigurationDriftRow,
} from './ConfigurationDriftPage.utils'
import { ConfigurationTomlViewer } from './ConfigurationTomlViewer'
import { AlertError } from '@/components/ui/AlertError'
import { useAuthConfigUpdateMutation } from '@/data/auth/auth-config-update-mutation'
import { useGitHubConfigPullRequestMutation } from '@/data/config/github-config-pull-request-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedGitHubConfigDrift } from '@/hooks/misc/useGitHubConfigDrift'
import type { GitHubConfigDriftField } from '@/lib/github-config-drift'
import type { GitHubConfigTarget } from '@/lib/github-config-effective'
import type { GitHubConfigPullRequestResponse, GitHubConfigSource } from '@/lib/github-config.types'

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

function ConfigurationSourceToolbar({
  source,
  target,
  requestedGitBranch,
  configContent,
  driftedFields,
  hasSourceBranchFallback,
}: {
  source: GitHubConfigSource
  target: GitHubConfigTarget
  requestedGitBranch?: string
  configContent?: string
  driftedFields: readonly GitHubConfigDriftField[]
  hasSourceBranchFallback: boolean
}) {
  const sourceFileName = source.path.split('/').at(-1) ?? source.path
  const repositoryUrl = `https://github.com/${source.repository}`
  const sourceBranchUrl = `${repositoryUrl}/tree/${source.branch
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`
  const requestedGitBranchUrl = requestedGitBranch
    ? `${repositoryUrl}/tree/${requestedGitBranch.split('/').map(encodeURIComponent).join('/')}`
    : undefined
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-dash-sidebar">
      <div className="flex flex-col gap-3 bg-surface-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface-200 text-foreground-muted">
            <FileCode2 className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            {source.htmlUrl ? (
              <a
                href={source.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${sourceFileName} on GitHub (opens in new tab)`}
                title={source.path}
                className="inline-flex max-w-full items-center gap-1 font-mono text-sm font-medium hover:underline"
              >
                <span className="truncate">{sourceFileName}</span>
                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
              </a>
            ) : (
              <p className="truncate font-mono text-sm font-medium" title={source.path}>
                {sourceFileName}
              </p>
            )}
            <div className="flex min-w-0 items-center gap-1 text-xs text-foreground-muted">
              <a
                href={repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${source.repository} repository (opens in new tab)`}
                className="truncate hover:text-foreground hover:underline"
              >
                {source.repository}
              </a>
              <span aria-hidden="true">·</span>
              <a
                href={sourceBranchUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${source.branch} source branch (opens in new tab)`}
                className="truncate font-mono hover:text-foreground hover:underline"
              >
                {source.branch}
              </a>
            </div>
          </div>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto"></div>
      </div>

      {configContent !== undefined && (
        <ConfigurationTomlViewer
          content={configContent}
          target={target}
          gitBranch={requestedGitBranch}
          gitBranchUrl={requestedGitBranchUrl}
          driftedFields={driftedFields}
        />
      )}

      {hasSourceBranchFallback && requestedGitBranch && (
        <div className="border-t border-border px-4 py-3">
          <div
            role="status"
            className="flex items-start gap-2 rounded-md border border-warning-400 bg-warning-200 px-3 py-2 text-sm text-foreground"
          >
            <FileWarning className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <span className="font-medium">Requested branch config was not found.</span> Studio
              requested <code>{requestedGitBranch}</code> and loaded <code>{source.branch}</code> ·{' '}
              <code>{source.path}</code> as the fallback source.
            </p>
          </div>
        </div>
      )}
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

function ResolutionAction({
  title,
  description,
  icon,
  disabled,
  loading,
  disabledReason,
  onClick,
}: {
  title: string
  description: string
  icon: ReactNode
  disabled?: boolean
  loading?: boolean
  disabledReason?: string
  onClick: () => void
}) {
  return (
    <Button
      variant="default"
      className="h-auto min-w-0 flex-1 items-start justify-start px-3 py-2.5 text-left [&>div:first-child]:mt-0.5"
      icon={icon}
      disabled={disabled}
      loading={loading}
      title={disabledReason}
      onClick={onClick}
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{title}</span>
        <span className="block truncate text-xs font-normal text-foreground-muted">
          {description}
        </span>
      </span>
    </Button>
  )
}

function ConfigurationDriftItem({
  row,
  canReset,
  isResetting,
  onReset,
}: {
  row: ConfigurationDriftRow
  canReset: boolean
  isResetting: boolean
  onReset?: (row: ConfigurationDriftRow) => void
}) {
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="default"
              size="tiny"
              aria-label={`Actions for ${row.settingLabel}`}
              className="w-full shrink-0 sm:w-auto"
              icon={<MoreHorizontal className="h-3.5 w-3.5" />}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              className="gap-x-2"
              disabled={!canReset || isResetting || onReset === undefined}
              onClick={() => onReset?.(row)}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to config.toml
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-x-2">
              <Link href={row.settingHref}>
                <ArrowRight className="h-3.5 w-3.5" />
                Open setting
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

export function ConfigurationDriftResults({
  rows,
  pullRequest,
  canRestoreLiveSetting = true,
  isAccepting = false,
  isRestoring = false,
  onAcceptRemoteChanges,
  onResetOne,
  onRestoreAll,
}: {
  rows: ConfigurationDriftRow[]
  pullRequest?: GitHubConfigPullRequestResponse
  canRestoreLiveSetting?: boolean
  isAccepting?: boolean
  isRestoring?: boolean
  onAcceptRemoteChanges?: () => void
  onResetOne?: (row: ConfigurationDriftRow) => void
  onRestoreAll?: () => void
}) {
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
              Current environment values are active. Resolve managed drift by accepting or
              restoring the intended values.
            </p>
          </div>
        </div>
      </div>

      <div>
        {rows.map((row) => (
          <ConfigurationDriftItem
            key={row.fieldName}
            row={row}
            canReset={canRestoreLiveSetting}
            isResetting={isRestoring}
            onReset={onResetOne}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2 border-t border-border bg-surface-100 px-4 py-4 sm:flex-row sm:px-5">
        {pullRequest === undefined && (
          <ResolutionAction
            title="Accept current environment values"
            description="Create one pull request"
            icon={<GitPullRequest className="h-4 w-4" />}
            disabled={!canRestoreLiveSetting || onAcceptRemoteChanges === undefined}
            loading={isAccepting}
            disabledReason={
              !canRestoreLiveSetting
                ? 'You need additional permissions to resolve Auth configuration drift'
                : onAcceptRemoteChanges === undefined
                  ? 'GitHub write access is not connected yet'
                  : undefined
            }
            onClick={() => onAcceptRemoteChanges?.()}
          />
        )}
        {driftCount > 0 && (
          <ResolutionAction
            title="Restore all from config.toml"
            description="Apply every intended value now"
            icon={<RotateCcw className="h-4 w-4" />}
            disabled={!canRestoreLiveSetting || onRestoreAll === undefined}
            loading={isRestoring}
            disabledReason={
              !canRestoreLiveSetting
                ? 'You need additional permissions to update Auth settings'
                : undefined
            }
            onClick={() => onRestoreAll?.()}
          />
        )}
      </div>

      {pullRequest && (
        <div
          className="border-t border-border px-4 py-4 sm:px-5"
          aria-label={`Pull request #${pullRequest.pullRequestNumber}`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <GitPullRequest className="mt-0.5 h-4 w-4 shrink-0 text-foreground-muted" />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Pull request
                </p>
                <p className="mt-1 truncate text-sm font-medium text-foreground">
                  <span className="mr-2 text-foreground-muted">
                    #{pullRequest.pullRequestNumber}
                  </span>
                  {pullRequest.pullRequestTitle}
                </p>
                <p className="mt-1 truncate text-xs text-foreground-muted">
                  Open · {pullRequest.branch}
                </p>
              </div>
            </div>
            <Button
              asChild
              variant="default"
              size="tiny"
              className="w-full shrink-0 sm:w-auto"
              icon={<ExternalLink className="h-3.5 w-3.5" />}
            >
              <a href={pullRequest.pullRequestUrl} target="_blank" rel="noreferrer">
                View on GitHub
              </a>
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

export function ConfigurationDriftPage() {
  const { ref: projectRef = '' } = useParams()
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false)
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false)
  const [selectedRestoreRow, setSelectedRestoreRow] = useState<ConfigurationDriftRow | null>(null)
  const [pullRequest, setPullRequest] = useState<GitHubConfigPullRequestResponse>()
  const {
    requestedGitBranch,
    target,
    source,
    configContent,
    hasSourceBranchFallback = false,
    summary,
    isReady,
    isPending,
    isFetching,
    isError,
    error,
    refetch,
  } = useSelectedGitHubConfigDrift()
  const { can: canUpdateAuthConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )
  const { mutateAsync: updateAuthConfig, isPending: isRestoring } = useAuthConfigUpdateMutation()
  const { mutateAsync: createPullRequest, isPending: isCreatingPullRequest } =
    useGitHubConfigPullRequestMutation()
  const driftRows = createConfigurationDriftRows(summary.driftedFields, projectRef)
  const comparableSettingCount = summary.managedCount + driftRows.length
  const restoreRows = selectedRestoreRow ? [selectedRestoreRow] : driftRows
  const restorePayload = createAuthConfigRestorePayloads(restoreRows)

  const onSelectAccept = () => {
    if (!canUpdateAuthConfig) {
      toast.error('You need additional permissions to resolve Auth configuration drift')
      return
    }
    if (!source) {
      toast.error('Refresh the GitHub configuration before creating a pull request')
      return
    }
    setIsAcceptModalOpen(true)
  }

  const onConfirmAccept = async () => {
    if (!projectRef || !source || !canUpdateAuthConfig || driftRows.length === 0) return

    try {
      const result = await createPullRequest({
        action: 'accept-remote-changes',
        projectRef,
        expectedSourceSha: source.sha,
        target,
        gitBranch: requestedGitBranch,
      })
      setPullRequest(result)
      setIsAcceptModalOpen(false)
      toast.success(`Pull request #${result.pullRequestNumber} created`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create pull request')
      await refetch()
    }
  }

  const onSelectRestore = (row?: ConfigurationDriftRow) => {
    if (!canUpdateAuthConfig) {
      toast.error('You need additional permissions to update Auth settings')
      return
    }

    const nextPayload = createAuthConfigRestorePayloads(row ? [row] : driftRows)
    if (!nextPayload.ok) {
      toast.error(nextPayload.error)
      return
    }

    setSelectedRestoreRow(row ?? null)
    setIsRestoreModalOpen(true)
  }

  const onConfirmRestore = async () => {
    if (!projectRef || !restorePayload.ok || !canUpdateAuthConfig) return

    try {
      await updateAuthConfig({ projectRef, config: restorePayload.payload })
      toast.success(
        selectedRestoreRow
          ? `${selectedRestoreRow.settingLabel} reset to config.toml`
          : `${driftRows.length} settings restored from config.toml`
      )
      setIsRestoreModalOpen(false)
      setSelectedRestoreRow(null)
      await refetch()
    } catch {
      // The shared Auth config mutation presents the API error and leaves this modal open to retry.
    }
  }

  if (isPending) {
    return <ConfigurationDriftPageSkeleton />
  }

  if (isError) {
    return (
      <AlertError
        projectRef={projectRef}
        subject="Could not check configuration drift"
        description="Refresh to compare the supported Auth settings with the selected GitHub branch again."
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
      <Card className="flex min-h-52 items-center justify-center px-6 text-center text-sm text-foreground-light">
        Configuration drift is unavailable for this project.
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {comparableSettingCount === 0 ? (
        <Card className="flex min-h-44 items-center justify-center px-6 text-center">
          <div className="max-w-lg">
            <Github className="mx-auto mb-3 h-6 w-6 text-foreground-muted" />
            <h2 className="text-sm font-medium">No comparable settings found</h2>
            <p className="mt-1 text-sm text-foreground-light">
              This branch does not define any supported, non-secret Auth settings that can be
              compared with the current environment.
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
        <ConfigurationDriftResults
          rows={driftRows}
          pullRequest={pullRequest}
          canRestoreLiveSetting={canUpdateAuthConfig}
          isAccepting={isCreatingPullRequest}
          isRestoring={isRestoring}
          onAcceptRemoteChanges={source && driftRows.length > 0 ? onSelectAccept : undefined}
          onResetOne={onSelectRestore}
          onRestoreAll={
            driftRows.length > 0 && createAuthConfigRestorePayloads(driftRows).ok
              ? () => onSelectRestore()
              : undefined
          }
        />
      )}

      {source && (
        <ConfigurationSourceToolbar
          source={source}
          target={target}
          requestedGitBranch={requestedGitBranch}
          configContent={configContent}
          driftedFields={summary.driftedFields}
          hasSourceBranchFallback={hasSourceBranchFallback}
        />
      )}

      <ConfirmationModal
        visible={isAcceptModalOpen}
        loading={isCreatingPullRequest}
        title={`Accept all ${driftRows.length} current environment values?`}
        description="Review every current environment value before creating one GitHub branch, commit, and pull request."
        confirmLabel="Create pull request"
        confirmLabelLoading="Creating pull request"
        onCancel={() => setIsAcceptModalOpen(false)}
        onConfirm={onConfirmAccept}
        disabled={!source || !canUpdateAuthConfig}
      >
        {source && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground-light">
              <span>Current environment</span>
              <ArrowRight className="h-3.5 w-3.5" />
              <code>config.toml pull request</code>
            </div>
            <div className="max-h-64 divide-y divide-border overflow-y-auto rounded-md border border-border bg-surface-100">
              {driftRows.map((row) => (
                <div key={row.fieldName} className="p-3">
                  <p className="mb-1 text-xs font-medium text-foreground-light">
                    {row.settingLabel}
                  </p>
                  <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-5 text-foreground">
                    {formatAuthConfigValue(row.fieldName, row.dashboardValue)}
                  </pre>
                </div>
              ))}
            </div>
            <p className="text-sm text-foreground-light">
              This creates a pull request against {source.branch}. It does not change the current
              environment, so drift remains until the pull request is merged and applied. This
              prototype may normalize TOML formatting; review the generated diff before merging.
            </p>
          </div>
        )}
      </ConfirmationModal>

      <ConfirmationModal
        visible={isRestoreModalOpen}
        variant="warning"
        loading={isRestoring}
        title={
          selectedRestoreRow
            ? `Reset ${selectedRestoreRow.settingLabel} to config.toml?`
            : `Restore all ${driftRows.length} settings from config.toml?`
        }
        description={
          selectedRestoreRow
            ? 'Review the intended value before changing this setting in the current environment.'
            : "Review every intended value before changing the current environment's active Auth configuration."
        }
        confirmLabel={selectedRestoreRow ? 'Reset setting' : 'Restore all settings'}
        confirmLabelLoading={selectedRestoreRow ? 'Resetting setting' : 'Restoring settings'}
        onCancel={() => {
          setIsRestoreModalOpen(false)
          setSelectedRestoreRow(null)
        }}
        onConfirm={onConfirmRestore}
        disabled={!restorePayload.ok || !canUpdateAuthConfig}
      >
        {restorePayload.ok && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground-light">
              <code>config.toml</code>
              <ArrowRight className="h-3.5 w-3.5" />
              <span>Current environment</span>
            </div>
            <div className="max-h-64 divide-y divide-border overflow-y-auto rounded-md border border-border bg-surface-100">
              {restoreRows.map((row) => (
                <div key={row.fieldName} className="p-3">
                  <p className="mb-1 text-xs font-medium text-foreground-light">
                    {row.settingLabel}
                  </p>
                  <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-5 text-foreground">
                    {formatAuthConfigValue(row.fieldName, row.githubValue)}
                  </pre>
                </div>
              ))}
            </div>
            <p className="text-sm text-foreground-light">
              This immediately replaces the active value in the current environment. config.toml and
              secret settings will not change.
            </p>
          </div>
        )}
      </ConfirmationModal>
    </div>
  )
}

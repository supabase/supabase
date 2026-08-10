import { useParams } from 'common'
import { ExternalLink, FileJson, GitBranch, Github, RefreshCw, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Button, cn } from 'ui'

import { GitHubManagedBadge } from './GitHubManagedBadge'
import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'
import type { Branch } from '@/data/branches/branches-query'
import { useBranchesQuery } from '@/data/branches/branches-query'
import { useGitHubConfigQuery } from '@/data/config/github-config-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { IS_PLATFORM } from '@/lib/constants'

const REPOSITORY_DEFAULT = '__repository_default__'

interface BranchOption {
  label: string
  value: string
}

export function ConfigStoragePage() {
  const { ref: projectRef = '' } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const parentProjectRef = project?.parent_project_ref ?? projectRef
  const shouldLoadBranches = IS_PLATFORM && Boolean(parentProjectRef)

  const { data: studioBranches = [], isPending: branchesPending } = useBranchesQuery(
    { projectRef: parentProjectRef },
    { enabled: shouldLoadBranches }
  )

  const routeBranch = studioBranches.find((branch) => branch.project_ref === projectRef)
  const routeGitBranch = getGitBranch(routeBranch)
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const [pathSearch, setPathSearch] = useState('')

  const requestedBranch =
    selectedBranch === null
      ? routeGitBranch
      : selectedBranch === REPOSITORY_DEFAULT
        ? undefined
        : selectedBranch
  const branchesReady = !shouldLoadBranches || !branchesPending

  const { data, error, isPending, isFetching, refetch } = useGitHubConfigQuery(
    { branch: requestedBranch },
    { enabled: branchesReady }
  )

  const branchOptions = useMemo(
    () => createBranchOptions(studioBranches, requestedBranch),
    [requestedBranch, studioBranches]
  )
  const selectedBranchValue = requestedBranch ?? REPOSITORY_DEFAULT
  const managedPaths = data?.managedPaths ?? []
  const filteredPaths = managedPaths.filter(
    (path) => !pathSearch || path.toLowerCase().includes(pathSearch.toLowerCase())
  )
  const parsedConfig = useMemo(() => JSON.stringify(data?.config ?? {}, null, 2), [data?.config])

  return (
    <div className="flex h-full min-h-[560px] flex-col overflow-hidden rounded-lg border border-border bg-surface-100 text-foreground">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-200">
            <Github className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">
                {data?.source.repository ?? 'GitHub configuration'}
              </span>
              {data && <Badge variant="success">Live from GitHub</Badge>}
            </div>
            <p className="truncate text-xs text-foreground-muted">
              {data
                ? `${data.source.path} at ${data.source.branch}`
                : 'Studio reads the selected branch without storing a snapshot'}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <label className="relative">
            <span className="sr-only">Git branch</span>
            <GitBranch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
            <select
              className="h-8 max-w-64 rounded-md border border-control bg-surface-100 py-1 pl-8 pr-7 text-xs outline-none focus:border-foreground-muted"
              value={selectedBranchValue}
              onChange={(event) => setSelectedBranch(event.target.value)}
              disabled={!branchesReady}
            >
              {branchOptions.map((branch) => (
                <option key={branch.value} value={branch.value}>
                  {branch.label}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="default"
            size="tiny"
            icon={<RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />}
            disabled={!branchesReady || isFetching}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        </div>
      </header>

      {isPending || !branchesReady ? (
        <div className="flex flex-1 items-center justify-center text-sm text-foreground-light">
          Reading config from GitHub…
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-xl rounded-lg border border-warning-400 bg-warning-200 px-5 py-4">
            <p className="text-sm font-medium text-warning-700">Could not read GitHub config</p>
            <p className="mt-1 text-sm text-warning-600">{error.message}</p>
            <p className="mt-3 text-xs text-warning-600">
              The Studio server uses <code>STUDIO_GITHUB_REPOSITORY</code> and the optional{' '}
              <code>STUDIO_GITHUB_TOKEN</code>. The token is never sent to the browser.
            </p>
          </div>
        </div>
      ) : !data ? (
        <div className="flex flex-1 items-center justify-center text-sm text-foreground-light">
          No GitHub configuration loaded.
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <aside className="flex w-80 shrink-0 flex-col border-r border-border">
            <div className="border-b border-border p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Managed settings
                </span>
                <span className="text-xs tabular-nums text-foreground-muted">
                  {managedPaths.length}
                </span>
              </div>
              <label className="relative block">
                <span className="sr-only">Filter managed settings</span>
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
                <input
                  type="search"
                  value={pathSearch}
                  onChange={(event) => setPathSearch(event.target.value)}
                  placeholder="Filter config paths"
                  className="h-8 w-full rounded-md border border-control bg-surface-100 pl-8 pr-2 text-xs outline-none placeholder:text-foreground-muted focus:border-foreground-muted"
                />
              </label>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {filteredPaths.length === 0 ? (
                <p className="px-2 py-3 text-xs text-foreground-muted">No matching config paths.</p>
              ) : (
                <ul className="space-y-1">
                  {filteredPaths.map((path) => (
                    <li
                      key={path}
                      className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-surface-200"
                    >
                      <code className="min-w-0 truncate text-xs" title={path}>
                        {path}
                      </code>
                      <GitHubManagedBadge configPath={path} managedPaths={managedPaths} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          <main className="flex min-w-0 flex-1 flex-col">
            <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border px-3">
              <FileJson className="h-4 w-4 text-brand" />
              <span className="truncate text-sm font-medium">{data.source.path}</span>
              <Badge>{data.source.format}</Badge>
              <div className="flex-1" />
              {data.source.htmlUrl && (
                <a
                  href={data.source.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-foreground-light hover:text-foreground"
                >
                  Open on GitHub
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <div className="min-h-0 flex-1">
              <CodeEditor
                id={`github-config-${data.source.branch}-${data.source.sha || data.source.path}`}
                language="json"
                value={parsedConfig}
                isReadOnly
                className="h-full"
              />
            </div>
          </main>
        </div>
      )}
    </div>
  )
}

function getGitBranch(branch: Branch | undefined): string | undefined {
  const gitBranch = branch?.git_branch?.trim()
  if (gitBranch) return gitBranch
  if (branch?.is_default) return undefined
  return branch?.name?.trim() || undefined
}

function createBranchOptions(
  branches: Branch[],
  requestedBranch: string | undefined
): BranchOption[] {
  const options = new Map<string, string>()
  const defaultBranch = branches.find((branch) => branch.is_default)
  const defaultGitBranch = getGitBranch(defaultBranch)

  options.set(
    defaultGitBranch ?? REPOSITORY_DEFAULT,
    defaultGitBranch ?? defaultBranch?.name ?? 'Repository default branch'
  )

  for (const branch of branches) {
    const value = getGitBranch(branch)
    if (value) options.set(value, value)
  }

  if (requestedBranch) options.set(requestedBranch, requestedBranch)

  return [...options].map(([value, label]) => ({ value, label }))
}

import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useParams } from 'common'
import { useRouter } from 'next/router'
import {
  GitBranch,
  Clock,
  GitCompare,
  Bug,
  Zap,
  Tag,
  Code,
  GitMerge,
  FileJson,
  Shield,
  ChevronDown,
  Search,
  X,
} from 'lucide-react'
import { Button, cn } from 'ui'
import { DiffEditor } from 'components/ui/DiffEditor'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'

const ENV_SERVER = 'http://localhost:3457'

// ─── API types ───────────────────────────────────────────────────────────────

interface BranchSummary {
  gitBranch: string
  lastCommittedAt: string
  envCount: number
}

interface EnvSnapshot {
  id: number
  gitBranch: string
  envName: string
  targetKey?: string
  target?: { type: 'environment'; environment: string } | { type: 'branch'; environment: string; branch: string }
  sources: ConfigStateSource[]
  committedAt: string
  resolved: Record<string, unknown>
}

interface ConfigStateSnapshot {
  id: number
  gitBranch: string
  targetKey: string
  target: { type: 'environment'; environment: string } | { type: 'branch'; environment: string; branch: string }
  sources: ConfigStateSource[]
  committedAt: string
  resolved: Record<string, unknown>
}

interface ConfigStateSource {
  name: string
  path: string
  config: Record<string, unknown>
}

// ─── API fetch functions ──────────────────────────────────────────────────────

async function fetchBranches(projectRef: string): Promise<BranchSummary[]> {
  const res = await fetch(`${ENV_SERVER}/projects/${projectRef}/config`)
  if (!res.ok) throw new Error(`config-storage error: ${res.status}`)
  return res.json()
}

async function fetchSnapshots(projectRef: string, gitBranch: string): Promise<EnvSnapshot[]> {
  const res = await fetch(
    `${ENV_SERVER}/projects/${projectRef}/config-state/${encodeURIComponent(gitBranch)}`
  )
  if (!res.ok) throw new Error(`config-storage error: ${res.status}`)
  const states = (await res.json()) as ConfigStateSnapshot[]
  return states.map((state) => ({
    id: state.id,
    gitBranch: state.gitBranch,
    envName:
      state.target.type === 'environment'
        ? state.target.environment
        : `${state.target.environment}:${state.target.branch}`,
    targetKey: state.targetKey,
    target: state.target,
    sources: state.sources,
    committedAt: state.committedAt,
    resolved: state.resolved,
  }))
}

// ─── Branch type helpers ──────────────────────────────────────────────────────

function detectBranchType(name: string): string {
  if (name === 'main' || name === 'master') return 'production'
  if (name === 'develop' || name === 'staging') return 'staging'
  if (name.startsWith('feat/') || name.startsWith('feature/')) return 'feature'
  if (name.startsWith('fix/') || name.startsWith('bugfix/')) return 'bugfix'
  if (name.startsWith('hotfix/')) return 'hotfix'
  if (name.startsWith('release/')) return 'release'
  return 'feature'
}

const branchTypeConfig: Record<string, { icon: typeof GitBranch; color: string }> = {
  production: { icon: Shield, color: 'text-warning' },
  staging: { icon: GitMerge, color: 'text-info' },
  feature: { icon: Code, color: 'text-foreground-light' },
  bugfix: { icon: Bug, color: 'text-warning' },
  hotfix: { icon: Zap, color: 'text-destructive' },
  release: { icon: Tag, color: 'text-brand' },
}

// ─── Env layer metadata ───────────────────────────────────────────────────────

const ENV_LAYER_ORDER = ['base', 'preview', 'production']

const ENV_LAYER_META: Record<string, { label: string; description: string }> = {
  base: { label: 'Base', description: 'supabase/config.json' },
  preview: { label: 'Preview', description: 'Resolved preview config' },
  production: { label: 'Production', description: 'Resolved production config' },
}

// ─── Time formatting ──────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ConfigStoragePage() {
  const { ref: projectRef = '' } = useParams()
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  // Config snapshots are stored against the parent project, while the URL may point at a preview branch ref.
  const parentProjectRef = project?.parent_project_ref ?? projectRef

  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const [selectedEnvName, setSelectedEnvName] = useState<string>('production')
  const [diffMode, setDiffMode] = useState(false)
  const [compareBranch, setCompareBranch] = useState<string | null>(null)
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false)
  const [compareBranchDropdownOpen, setCompareBranchDropdownOpen] = useState(false)
  const [branchSearch, setBranchSearch] = useState('')
  const [showResolved, setShowResolved] = useState(true)

  // ── Queries ──────────────────────────────────────────────────────────────

  const {
    data: branches = [],
    isLoading: branchesLoading,
    error: branchesError,
  } = useQuery({
    queryKey: ['config-storage-branches', parentProjectRef],
    queryFn: () => fetchBranches(parentProjectRef),
    enabled: !!parentProjectRef,
    refetchInterval: 10000,
  })

  const { data: studioBranches = [] } = useBranchesQuery({
    projectRef: parentProjectRef,
  })

  useEffect(() => {
    if (branches.length === 0 || selectedBranch) return

    const routeBranch = studioBranches.find((branch) => branch.project_ref === projectRef)
    const routeGitBranch = routeBranch?.is_default ? 'main' : (routeBranch?.git_branch ?? routeBranch?.name)
    const initialBranch =
      branches.find((branch) => branch.gitBranch === routeGitBranch) ?? branches[0]

    if (initialBranch) {
      setSelectedBranch(initialBranch.gitBranch)
    }
  }, [branches, projectRef, selectedBranch, studioBranches])

  const { data: snapshots = [], isLoading: snapshotsLoading } = useQuery({
    queryKey: ['config-storage-snapshots', parentProjectRef, selectedBranch],
    queryFn: () => fetchSnapshots(parentProjectRef, selectedBranch!),
    enabled: !!parentProjectRef && !!selectedBranch,
  })

  const { data: compareSnapshots = [], isLoading: compareLoading } = useQuery({
    queryKey: ['config-storage-snapshots', parentProjectRef, compareBranch],
    queryFn: () => fetchSnapshots(parentProjectRef, compareBranch!),
    enabled: !!parentProjectRef && !!compareBranch && diffMode,
  })

  // ── Derived values ────────────────────────────────────────────────────────

  const currentBranchInfo = branches.find((b) => b.gitBranch === selectedBranch)
  const branchType = selectedBranch ? detectBranchType(selectedBranch) : 'feature'
  const BranchCfg = branchTypeConfig[branchType] ?? branchTypeConfig.feature
  const BranchIcon = BranchCfg.icon

  const compareBranchType = compareBranch ? detectBranchType(compareBranch) : null
  const CompareCfg = compareBranchType
    ? (branchTypeConfig[compareBranchType] ?? branchTypeConfig.feature)
    : null
  const CompareBranchIcon = CompareCfg?.icon ?? GitBranch

  const availableEnvNames = ENV_LAYER_ORDER.filter((name) =>
    snapshots.some((s) => s.envName === name)
  )
  const branchEnvNames = snapshots
    .map((s) => s.envName)
    .filter((name) => !ENV_LAYER_ORDER.includes(name))
  const allEnvNames = [...availableEnvNames, ...branchEnvNames]

  useEffect(() => {
    if (snapshots.length === 0) return
    if (snapshots.some((snapshot) => snapshot.envName === selectedEnvName)) return
    setSelectedEnvName(allEnvNames[0] ?? 'production')
  }, [allEnvNames, selectedEnvName, snapshots])

  const getConfigJson = (branchSnapshots: EnvSnapshot[]) => {
    if (branchSnapshots.length === 0) return ''

    const snapshot = branchSnapshots.find((s) => s.envName === selectedEnvName)
    const config = showResolved
      ? snapshot?.resolved ?? {}
      : Object.fromEntries(snapshot?.sources.map((source) => [source.name, source.config]) ?? [])

    return JSON.stringify(config, null, 2)
  }

  const currentJson = getConfigJson(snapshots)

  const originalJson = diffMode ? getConfigJson(compareSnapshots) : ''

  const filteredBranches = branches.filter(
    (b) => !branchSearch || b.gitBranch.toLowerCase().includes(branchSearch.toLowerCase())
  )

  // ── Event handlers ────────────────────────────────────────────────────────

  const startDiff = (branch: string) => {
    setCompareBranch(branch)
    setDiffMode(true)
    setCompareBranchDropdownOpen(false)
  }

  const exitDiff = () => {
    setDiffMode(false)
    setCompareBranch(null)
  }

  const selectBranch = (branch: BranchSummary) => {
    const studioBranch = studioBranches.find((b) => {
      // The default branch is represented by name/is_default in Studio, not always by git_branch.
      if (branch.gitBranch === 'main' || branch.gitBranch === 'master') return b.is_default
      return b.git_branch === branch.gitBranch || b.name === branch.gitBranch
    })

    if (studioBranch?.project_ref && studioBranch.project_ref !== projectRef) {
      router.push(`/project/${studioBranch.project_ref}/branches/config-storage`)
    }

    setSelectedBranch(branch.gitBranch)
    setBranchDropdownOpen(false)
    setBranchSearch('')
    setSelectedEnvName('production')
    exitDiff()
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (branchesError) {
    return (
      <div className="p-6 text-sm text-foreground-light">
        Could not connect to config-storage service (env-server at {ENV_SERVER}).
        <br />
        Make sure <code className="font-mono">node apps/env-server/server.js</code> is running.
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const envLabel = ENV_LAYER_META[selectedEnvName]?.label ?? `${selectedEnvName}.json`

  return (
    <div className="flex flex-col h-full text-foreground">
      {/* ── Header ── */}
      <header className="border-b border-border shrink-0">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">Config Storage</h1>
            <span className="text-foreground-muted">/</span>

            {/* Branch selector */}
            <div className="relative">
              <Button
                type="default"
                size="tiny"
                onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                icon={
                  selectedBranch ? (
                    <BranchIcon className={cn('w-4 h-4', BranchCfg.color)} />
                  ) : undefined
                }
                iconRight={<ChevronDown className="w-3.5 h-3.5 text-foreground-light" />}
              >
                {selectedBranch ? (
                  <span className="font-medium">{selectedBranch}</span>
                ) : (
                  <span className="text-foreground-light">Select branch…</span>
                )}
              </Button>

              {branchDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => {
                      setBranchDropdownOpen(false)
                      setBranchSearch('')
                    }}
                  />
                  <div className="absolute top-full left-0 mt-2 w-80 bg-surface-100 border border-border rounded-xl shadow-2xl z-20 overflow-hidden">
                    <div className="p-2 border-b border-border">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
                        <input
                          type="text"
                          placeholder="Search branches..."
                          value={branchSearch}
                          onChange={(e) => setBranchSearch(e.target.value)}
                          className="w-full bg-surface-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-72 overflow-auto py-1">
                      {branchesLoading ? (
                        <div className="px-3 py-4 text-sm text-foreground-light text-center">
                          Loading...
                        </div>
                      ) : filteredBranches.length === 0 ? (
                        <div className="px-3 py-4 text-sm text-foreground-light text-center">
                          No branches found
                        </div>
                      ) : (
                        filteredBranches.map((branch) => {
                          const type = detectBranchType(branch.gitBranch)
                          const cfg = branchTypeConfig[type] ?? branchTypeConfig.feature
                          const Icon = cfg.icon
                          return (
                            <button
                              key={branch.gitBranch}
                              onClick={() => selectBranch(branch)}
                              className={cn(
                                'w-full text-left px-3 py-2 flex items-center justify-between hover:bg-surface-200 transition-colors text-sm',
                                selectedBranch === branch.gitBranch && 'bg-surface-200'
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Icon className={cn('w-4 h-4 shrink-0', cfg.color)} />
                                <span className="truncate">{branch.gitBranch}</span>
                              </div>
                              <span className="text-xs text-foreground-muted shrink-0 ml-2">
                                {timeAgo(branch.lastCommittedAt)}
                              </span>
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {currentBranchInfo && (
            <div className="flex items-center gap-2 text-sm text-foreground-muted">
              <Clock className="w-4 h-4" />
              <span>Pushed {timeAgo(currentBranchInfo.lastCommittedAt)}</span>
            </div>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      {!selectedBranch ? (
        <div className="flex-1 flex items-center justify-center text-sm text-foreground-light">
          {branchesLoading ? (
            'Loading branches...'
          ) : branches.length === 0 ? (
            <div className="text-center">
              <p>No config snapshots yet.</p>
              <p className="mt-1 text-xs">
                Run <code className="font-mono">supa dev</code> to create one.
              </p>
            </div>
          ) : (
            'Select a branch to view its config'
          )}
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* ── Left sidebar: env layers ── */}
          <aside className="w-56 shrink-0 border-r border-border px-2 py-3 overflow-y-auto">
            <div className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-3">
              Environment Layers
            </div>
            <nav className="space-y-1">
              {snapshotsLoading ? (
                <div className="text-sm text-foreground-light py-2">Loading...</div>
              ) : allEnvNames.length === 0 ? (
                <div className="text-sm text-foreground-light py-2">No snapshots</div>
              ) : (
                allEnvNames.map((envName) => {
                  const snapshot = snapshots.find((s) => s.envName === envName)
                  const meta = ENV_LAYER_META[envName] ?? {
                    label: envName,
                    description: 'Resolved branch config',
                  }
                  const isSelected = selectedEnvName === envName
                  return (
                    <button
                      key={envName}
                      onClick={() => setSelectedEnvName(envName)}
                      className={cn(
                        'w-full text-left px-2.5 py-2 rounded-lg transition-colors flex items-center gap-3',
                        isSelected
                          ? 'bg-brand/10 text-foreground'
                          : 'text-foreground-light hover:bg-surface-200 hover:text-foreground'
                      )}
                    >
                      <FileJson
                        className={cn(
                          'w-4 h-4 shrink-0',
                          isSelected ? 'text-brand' : 'text-foreground-muted'
                        )}
                      />
                      <div>
                        <div className="font-medium text-sm">{meta.label}</div>
                        <div className="text-xs text-foreground-muted">
                          {snapshot?.sources.length ? snapshot.sources.map((source) => source.name).join(' + ') : meta.description}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </nav>
          </aside>

          {/* ── Main config viewer ── */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
              <FileJson className="w-4 h-4 text-brand" />
              <span className="font-medium text-sm">{envLabel}</span>
              <div className="flex-1" />
              {!diffMode && (
                <Button
                  type={showResolved ? 'default' : 'text'}
                  size="tiny"
                  onClick={() => setShowResolved(!showResolved)}
                >
                  {showResolved ? 'Resolved' : 'Sources'}
                </Button>
              )}
              {/* Compare controls */}
              {!diffMode ? (
                <div className="relative">
                  <Button
                    type="default"
                    size="tiny"
                    onClick={() => setCompareBranchDropdownOpen(!compareBranchDropdownOpen)}
                    icon={<GitCompare className="w-4 h-4" />}
                    iconRight={<ChevronDown className="w-3 h-3" />}
                  >
                    Compare
                  </Button>

                  {compareBranchDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setCompareBranchDropdownOpen(false)}
                      />
                      <div className="absolute top-full right-0 mt-1 w-72 bg-surface-100 border border-border rounded-lg shadow-xl z-20 overflow-hidden">
                        <div className="px-3 py-2 border-b border-border">
                          <div className="text-xs text-foreground-muted">Compare against</div>
                        </div>
                        <div className="max-h-64 overflow-auto py-1">
                          {branches
                            .filter((b) => b.gitBranch !== selectedBranch)
                            .map((branch) => {
                              const type = detectBranchType(branch.gitBranch)
                              const cfg = branchTypeConfig[type] ?? branchTypeConfig.feature
                              const Icon = cfg.icon
                              return (
                                <button
                                  key={branch.gitBranch}
                                  onClick={() => startDiff(branch.gitBranch)}
                                  className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-surface-200 transition-colors"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Icon className={cn('w-3.5 h-3.5 shrink-0', cfg.color)} />
                                    <span className="text-sm truncate">{branch.gitBranch}</span>
                                  </div>
                                  <span className="text-xs text-foreground-muted shrink-0 ml-2">
                                    {timeAgo(branch.lastCommittedAt)}
                                  </span>
                                </button>
                              )
                            })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-foreground-muted">Comparing</span>
                  <span className="font-medium">{selectedBranch}</span>
                  <GitCompare className="w-3.5 h-3.5 text-foreground-muted" />

                  <div className="relative">
                    <Button
                      type="default"
                      size="tiny"
                      onClick={() => setCompareBranchDropdownOpen(!compareBranchDropdownOpen)}
                      icon={
                        CompareCfg ? (
                          <CompareBranchIcon className={cn('w-3.5 h-3.5', CompareCfg.color)} />
                        ) : undefined
                      }
                      iconRight={<ChevronDown className="w-3 h-3" />}
                    >
                      <span className="font-medium">{compareBranch}</span>
                    </Button>

                    {compareBranchDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setCompareBranchDropdownOpen(false)}
                        />
                        <div className="absolute top-full right-0 mt-1 w-72 bg-surface-100 border border-border rounded-lg shadow-xl z-20 overflow-hidden py-1">
                          {branches
                            .filter((b) => b.gitBranch !== selectedBranch)
                            .map((branch) => {
                              const type = detectBranchType(branch.gitBranch)
                              const cfg = branchTypeConfig[type] ?? branchTypeConfig.feature
                              const Icon = cfg.icon
                              return (
                                <button
                                  key={branch.gitBranch}
                                  onClick={() => startDiff(branch.gitBranch)}
                                  className={cn(
                                    'w-full text-left px-3 py-2 flex items-center justify-between hover:bg-surface-200 transition-colors text-sm',
                                    compareBranch === branch.gitBranch && 'bg-surface-200'
                                  )}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Icon className={cn('w-3.5 h-3.5 shrink-0', cfg.color)} />
                                    <span className="truncate">{branch.gitBranch}</span>
                                  </div>
                                  <span className="text-xs text-foreground-muted shrink-0 ml-2">
                                    {timeAgo(branch.lastCommittedAt)}
                                  </span>
                                </button>
                              )
                            })}
                        </div>
                      </>
                    )}
                  </div>

                  <Button
                    type="text"
                    size="tiny"
                    onClick={exitDiff}
                    icon={<X className="w-4 h-4" />}
                  />
                </div>
              )}
            </div>

            {/* Editor area */}
            <div className="flex-1 overflow-hidden">
              {snapshotsLoading ? (
                <div className="p-4 text-sm text-foreground-light">Loading…</div>
              ) : diffMode ? (
                compareLoading ? (
                  <div className="p-4 text-sm text-foreground-light">Loading compare branch…</div>
                ) : (
                  <DiffEditor
                    // Monaco keeps models alive internally; remount when comparison inputs change so stale models do not hide the visual diff.
                    key={[
                      selectedBranch,
                      compareBranch,
                      selectedEnvName,
                      showResolved ? 'resolved' : 'sources',
                    ].join(':')}
                    language="json"
                    original={originalJson}
                    modified={currentJson}
                    height="100%"
                    options={{ renderSideBySide: true, readOnly: true }}
                  />
                )
              ) : (
                <CodeEditor
                  id={`config-storage-${selectedBranch}-${selectedEnvName}`}
                  language="json"
                  value={currentJson}
                  isReadOnly
                  className="h-full"
                />
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  )
}

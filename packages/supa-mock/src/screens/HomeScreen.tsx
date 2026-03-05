import { Auth, Database, Realtime, Storage } from 'icons'
import { ChevronLeft, ExternalLink, Shield, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
} from 'ui'

import { useMockProject } from '../providers/MockProjectContext'

// ─── Mock Data ──────────────────────────────────────────────────────────

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

const MOCK_STATS = { tables: 20, functions: 15, replicas: 0 }

type TimeRange = '60min' | '24h' | '7d'

const TIME_RANGE_OPTIONS: { key: TimeRange; label: string; description: string }[] = [
  { key: '60min', label: 'Last 60 minutes', description: 'Statistics for last 60 minutes' },
  { key: '24h', label: 'Last 24 hours', description: 'Statistics for last 24 hours' },
  { key: '7d', label: 'Last 7 days', description: 'Statistics for last 7 days' },
]

function generateUsageData(range: TimeRange) {
  const offset = range === '60min' ? 100 : range === '7d' ? 200 : 0
  const count = range === '60min' ? 12 : range === '7d' ? 7 : 24
  const restScale = range === '60min' ? 30 : range === '7d' ? 1400 : 200
  const restBase = range === '60min' ? 5 : range === '7d' ? 300 : 50
  const authScale = range === '60min' ? 10 : range === '7d' ? 500 : 80
  const authBase = range === '60min' ? 1 : range === '7d' ? 60 : 10
  const storageScale = range === '60min' ? 8 : range === '7d' ? 400 : 60
  const storageBase = range === '60min' ? 0 : range === '7d' ? 30 : 5
  const realtimeScale = range === '60min' ? 6 : range === '7d' ? 300 : 40
  const realtimeBase = range === '60min' ? 1 : range === '7d' ? 20 : 5

  return Array.from({ length: count }, (_, i) => ({
    rest: Math.floor(seededRandom((i + offset) * 4) * restScale + restBase),
    auth: Math.floor(seededRandom((i + offset) * 4 + 1) * authScale + authBase),
    storage: Math.floor(seededRandom((i + offset) * 4 + 2) * storageScale + storageBase),
    realtime: Math.floor(seededRandom((i + offset) * 4 + 3) * realtimeScale + realtimeBase),
  }))
}

interface SecurityLint {
  summary: string
  title: string
  severity: 'warning' | 'error'
  entity: string
  issue: string
  description: string
}

const MOCK_SECURITY_LINTS: SecurityLint[] = [
  {
    summary: 'Table `public.products` has a row level security policy `Allow read...',
    title: 'Auth RLS Initialization Plan',
    severity: 'warning',
    entity: 'public.products',
    issue:
      'Table `public.products` has a row level security policy `Allow read access` that re-evaluates `current_setting()` or `auth.<function>()` for each row. This produces suboptimal query performance at scale. Resolve the issue by replacing `auth.<function>()` with `(select auth.<function>())`.',
    description:
      'Detects if calls to `current_setting()` and `auth.<function>()` in RLS policies are being unnecessarily re-evaluated for each row.',
  },
  {
    summary: 'Table `public.products` has a row level security policy `Allow insert...',
    title: 'Auth RLS Initialization Plan',
    severity: 'warning',
    entity: 'public.products',
    issue:
      'Table `public.products` has a row level security policy `Allow insert` that re-evaluates `current_setting()` or `auth.<function>()` for each row. This produces suboptimal query performance at scale.',
    description:
      'Detects if calls to `current_setting()` and `auth.<function>()` in RLS policies are being unnecessarily re-evaluated for each row.',
  },
  {
    summary: 'Table `public.orders` has a row level security policy `Allow auth...',
    title: 'Auth RLS Initialization Plan',
    severity: 'warning',
    entity: 'public.orders',
    issue:
      'Table `public.orders` has a row level security policy `Allow auth users` that re-evaluates `current_setting()` or `auth.<function>()` for each row.',
    description:
      'Detects if calls to `current_setting()` and `auth.<function>()` in RLS policies are being unnecessarily re-evaluated for each row.',
  },
  {
    summary: 'Table `public.orders` has a row level security policy `Allow user...',
    title: 'Auth RLS Initialization Plan',
    severity: 'warning',
    entity: 'public.orders',
    issue:
      'Table `public.orders` has a row level security policy `Allow user access` that re-evaluates `current_setting()` or `auth.<function>()` for each row.',
    description:
      'Detects if calls to `current_setting()` and `auth.<function>()` in RLS policies are being unnecessarily re-evaluated for each row.',
  },
  {
    summary: 'Function `public.get_config` has a role mutable search_path',
    title: 'Function Search Path Mutable',
    severity: 'warning',
    entity: 'public.get_config',
    issue:
      'Function `public.get_config` has a role mutable `search_path`, meaning the function could potentially be hijacked by a malicious user.',
    description:
      'Detects functions where the search_path is mutable, which could allow search path injection attacks.',
  },
  {
    summary: 'Function `public.run_task` has a role mutable search_path',
    title: 'Function Search Path Mutable',
    severity: 'warning',
    entity: 'public.run_task',
    issue:
      'Function `public.run_task` has a role mutable `search_path`, meaning the function could potentially be hijacked by a malicious user.',
    description:
      'Detects functions where the search_path is mutable, which could allow search path injection attacks.',
  },
]

const MOCK_SLOW_QUERIES = [
  { query: 'select public.compute_aggregates($1) limit $2', avgTime: '2.15s', calls: 8 },
  { query: 'select public.sync_records(jsonb_build_object($1,$2))', avgTime: '4.10s', calls: 12 },
  { query: 'SELECT name FROM pg_timezone_names', avgTime: '0.47s', calls: 192 },
  { query: 'with table_info as ( select n.nspname::text as schem...', avgTime: '5.37s', calls: 1 },
  { query: 'with table_info as ( select n.nspname::text as schem...', avgTime: '5.26s', calls: 1 },
]

// ─── Mini Bar Chart (mocked) ────────────────────────────────────────────

function MiniBarChart({
  data,
  color = '#3ECF8E',
  animationKey,
}: {
  data: number[]
  color?: string
  animationKey?: string
}) {
  const max = Math.max(...data, 1)
  return (
    <div key={animationKey} className="flex items-end gap-[2px] h-20 w-full">
      {data.map((val, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm min-h-[2px] origin-bottom animate-[bar-grow_0.2s_ease-in-out_both]"
          style={{
            height: `${(val / max) * 100}%`,
            backgroundColor: color,
            opacity: 0.7,
            animationDelay: `${i * 15}ms`,
          }}
        />
      ))}
      <style>{`
        @keyframes bar-grow {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
      `}</style>
    </div>
  )
}

// ─── Usage Panel ────────────────────────────────────────────────────────

function UsagePanel({
  icon,
  title,
  metricLabel,
  data,
  total,
  animationKey,
}: {
  icon: React.ReactNode
  title: string
  metricLabel: string
  data: number[]
  total: number
  animationKey?: string
}) {
  return (
    <div className="rounded-md border bg-surface-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 space-y-4">
        <div className="flex items-center space-x-3 opacity-80">
          <div className="rounded bg-surface-300 p-1.5 text-foreground-light shadow-sm">{icon}</div>
          <h4 className="mb-0 text-lg">{title}</h4>
        </div>
        <div>
          <p className="text-xs text-foreground-lighter mb-1">{metricLabel}</p>
          <p className="text-xl tabular-nums text-foreground">{total.toLocaleString()}</p>
        </div>
        <MiniBarChart data={data} animationKey={animationKey} />
      </div>
    </div>
  )
}

// ─── Advisor Widget ─────────────────────────────────────────────────────

function InlineCode({ children }: { children: string }) {
  return <code className="text-xs bg-surface-300 px-1 py-0.5 rounded font-mono">{children}</code>
}

function RenderWithCode({ text }: { text: string }) {
  return (
    <>
      {text
        .split('`')
        .map((part, i) =>
          i % 2 === 1 ? <InlineCode key={i}>{part}</InlineCode> : <span key={i}>{part}</span>
        )}
    </>
  )
}

function LintDetailPanel({ lint, onClose }: { lint: SecurityLint; onClose: () => void }) {
  return (
    <div className="absolute top-0 right-0 h-full w-[420px] border-l bg-dash-sidebar flex flex-col z-10">
      <div className="flex items-center gap-2 px-4 min-h-[46px] border-b">
        <button
          onClick={onClose}
          className="text-foreground-lighter hover:text-foreground transition-colors"
        >
          <ChevronLeft size={16} strokeWidth={1.5} />
        </button>
        <span className="text-sm truncate flex-1">{lint.title}</span>
        <Badge variant="warning" className="uppercase !text-[10px] flex-shrink-0">
          {lint.severity}
        </Badge>
        <button
          onClick={onClose}
          className="text-foreground-lighter hover:text-foreground transition-colors ml-1"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-foreground-light">Entity</p>
          <div className="inline-flex items-center gap-1.5 bg-surface-200 border rounded px-2 py-1">
            <Database size={12} strokeWidth={1.5} className="text-foreground-muted" />
            <span className="text-sm font-mono">{lint.entity}</span>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-foreground-light">Issue</p>
          <p className="text-sm text-foreground-lighter leading-relaxed">
            <RenderWithCode text={lint.issue} />
            {'. '}
            See <button className="text-foreground-light underline underline-offset-2">
              docs
            </button>{' '}
            for more info.
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-foreground-light">Description</p>
          <p className="text-sm text-foreground-lighter leading-relaxed">
            <RenderWithCode text={lint.description} />
          </p>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-foreground-light">Resolve</p>
          <div className="flex items-center gap-2">
            <Button type="alternative" size="tiny">
              Ask Assistant
            </Button>
            <Button type="default" size="tiny">
              View policies
            </Button>
            <button className="flex items-center gap-1 text-xs text-foreground-lighter hover:text-foreground transition-colors ml-1">
              Learn more
              <ExternalLink size={12} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MockAdvisorWidget({ onSelectLint }: { onSelectLint: (lint: SecurityLint) => void }) {
  const totalIssues = MOCK_SECURITY_LINTS.length

  return (
    <div className="@container">
      <div className="flex justify-between items-center mb-6">
        <h2>
          {totalIssues} issues need <span className="text-warning">attention</span>
        </h2>
      </div>
      <div style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }} className="grid gap-4">
        {/* Security / Performance Tabs */}
        <Card className="h-80">
          <Tabs defaultValue="security" className="h-full flex flex-col">
            <CardHeader className="h-10 py-0 pl-4 pr-2 flex flex-row items-center justify-between flex-0">
              <TabsList className="flex justify-start rounded-none gap-x-4 border-b-0 !mt-0 pt-0">
                <TabsTrigger
                  value="security"
                  className="flex items-center gap-2 text-xs py-3 border-b-[1px] font-mono uppercase"
                >
                  Security{' '}
                  <div className="rounded bg-warning text-warning-100 px-1">{totalIssues}</div>
                </TabsTrigger>
                <TabsTrigger
                  value="performance"
                  className="flex items-center gap-2 text-xs py-3 border-b-[1px] font-mono uppercase"
                >
                  Performance
                </TabsTrigger>
              </TabsList>
              <Button type="text" className="!mt-0 w-7" icon={<ExternalLink />} />
            </CardHeader>
            <CardContent className="!p-0 mt-0 flex-1 overflow-y-auto">
              <TabsContent value="security" className="p-0 mt-0 h-full">
                <ul>
                  {MOCK_SECURITY_LINTS.map((lint, i) => (
                    <li
                      key={i}
                      className="text-sm w-full border-b my-0 last:border-b-0 group px-4 cursor-pointer hover:bg-surface-200 transition-colors"
                      onClick={() => onSelectLint(lint)}
                    >
                      <div className="flex items-center gap-2 py-3">
                        <Shield
                          size={14}
                          strokeWidth={1.5}
                          className="text-foreground-muted flex-shrink-0"
                        />
                        <p className="font-mono text-xs text-foreground-light truncate">
                          {lint.summary}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </TabsContent>
              <TabsContent value="performance" className="p-0 mt-0 h-full">
                <div className="flex-1 flex flex-col h-full items-center justify-center gap-2">
                  <Shield size={20} strokeWidth={1.5} className="text-foreground-muted" />
                  <p className="text-sm text-foreground-light">No performance issues found</p>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Slow Queries */}
        <Card className="h-80 flex flex-col">
          <CardHeader className="h-10 flex-row items-center justify-between py-0 pl-4 pr-2">
            <CardTitle>Slow Queries</CardTitle>
            <Button type="text" className="!mt-0 w-7" icon={<ExternalLink />} />
          </CardHeader>
          <CardContent className="!p-0 flex-1 overflow-y-auto">
            <Table className="text-xs font-mono max-w-full mt-0">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-foreground-lighter truncate py-2 h-auto">
                    Query
                  </TableHead>
                  <TableHead className="text-foreground-lighter truncate py-2 h-auto">
                    Avg time
                  </TableHead>
                  <TableHead className="text-foreground-lighter truncate py-2 h-auto">
                    Calls
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_SLOW_QUERIES.map((q, i) => (
                  <TableRow key={i} className="py-2">
                    <TableCell className="font-mono truncate max-w-xs">{q.query}</TableCell>
                    <TableCell className="font-mono truncate max-w-xs">{q.avgTime}</TableCell>
                    <TableCell className="font-mono truncate max-w-xs">{q.calls}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Home Screen ────────────────────────────────────────────────────────

export function HomeScreen() {
  const { project } = useMockProject()
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')
  const [rangeDropdownOpen, setRangeDropdownOpen] = useState(false)
  const [selectedLint, setSelectedLint] = useState<SecurityLint | null>(null)

  const usageData = useMemo(() => generateUsageData(timeRange), [timeRange])
  const selectedOption = TIME_RANGE_OPTIONS.find((o) => o.key === timeRange)!

  const restTotal = usageData.reduce((sum, d) => sum + d.rest, 0)
  const authTotal = usageData.reduce((sum, d) => sum + d.auth, 0)
  const storageTotal = usageData.reduce((sum, d) => sum + d.storage, 0)
  const realtimeTotal = usageData.reduce((sum, d) => sum + d.realtime, 0)

  return (
    <div className="relative w-full h-full">
      <div className="w-full h-full overflow-auto px-4">
        {/* Section 1: Header */}
        <div className="py-8 border-b border-muted">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between w-full">
              <div className="flex flex-col md:flex-row md:items-end gap-3">
                <h1 className="text-3xl">{project.name}</h1>
                <div className="flex items-center gap-x-2 mb-1">
                  <Badge variant="default">Nano</Badge>
                </div>
              </div>
              <div className="flex items-center gap-x-6">
                <div className="flex flex-col gap-y-1">
                  <span className="text-foreground-light text-sm">Tables</span>
                  <p className="text-2xl tabular-nums">{MOCK_STATS.tables}</p>
                </div>
                <div className="flex flex-col gap-y-1">
                  <span className="text-foreground-light text-sm">Functions</span>
                  <p className="text-2xl tabular-nums">{MOCK_STATS.functions}</p>
                </div>
                <div className="flex flex-col gap-y-1">
                  <span className="text-foreground-light text-sm">Replicas</span>
                  <p className="text-2xl tabular-nums">{MOCK_STATS.replicas}</p>
                </div>
                <div className="ml-6 pl-6 border-l flex items-center">
                  <Button type="default" className="rounded-full">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-brand" />
                      Project Status
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Usage */}
        <div className="py-16 ">
          <div className="mx-auto max-w-7xl space-y-16 @container">
            <div className="space-y-6">
              <div className="flex flex-row items-center gap-x-2">
                <div className="relative">
                  <Button
                    type="default"
                    size="tiny"
                    onClick={() => setRangeDropdownOpen(!rangeDropdownOpen)}
                  >
                    {selectedOption.label}
                    <span className="ml-1 text-foreground-lighter">&#9662;</span>
                  </Button>
                  {rangeDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 z-50 min-w-[180px] rounded-md border border-default bg-overlay shadow-md py-1">
                      {TIME_RANGE_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => {
                            setTimeRange(opt.key)
                            setRangeDropdownOpen(false)
                          }}
                          className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-foreground-light hover:bg-surface-200 hover:text-foreground transition-colors"
                        >
                          <div className="w-3 flex justify-center">
                            {opt.key === timeRange && (
                              <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                            )}
                          </div>
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-xs text-foreground-light">{selectedOption.description}</span>
              </div>
              <div
                style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
                className="grid gap-4"
              >
                <UsagePanel
                  icon={<Database strokeWidth={1.5} size={16} />}
                  title="Database"
                  metricLabel="REST Requests"
                  data={usageData.map((d) => d.rest)}
                  total={restTotal}
                  animationKey={timeRange}
                />
                <UsagePanel
                  icon={<Auth strokeWidth={1.5} size={16} />}
                  title="Auth"
                  metricLabel="Auth Requests"
                  data={usageData.map((d) => d.auth)}
                  total={authTotal}
                  animationKey={timeRange}
                />
                <UsagePanel
                  icon={<Storage strokeWidth={1.5} size={16} />}
                  title="Storage"
                  metricLabel="Storage Requests"
                  data={usageData.map((d) => d.storage)}
                  total={storageTotal}
                  animationKey={timeRange}
                />
                <UsagePanel
                  icon={<Realtime strokeWidth={1.5} size={16} />}
                  title="Realtime"
                  metricLabel="Realtime Connections"
                  data={usageData.map((d) => d.realtime)}
                  total={realtimeTotal}
                  animationKey={timeRange}
                />
              </div>
            </div>

            {/* Advisor */}
            <MockAdvisorWidget onSelectLint={setSelectedLint} />
          </div>
        </div>
      </div>

      {/* Right-side lint detail panel */}
      {selectedLint && (
        <LintDetailPanel lint={selectedLint} onClose={() => setSelectedLint(null)} />
      )}
    </div>
  )
}

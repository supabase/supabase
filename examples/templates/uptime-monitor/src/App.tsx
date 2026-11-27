import { gt, isNull, useLiveQuery } from '@tanstack/react-db'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'

import { checks, incidents, monitors, type Check, type Incident, type Monitor } from './collections'
import { ensureSession, seedMonitors } from './session'
import { ThemeSwitch } from './ThemeSwitch'

const WINDOW_MINUTES = 60
const BARS = 40

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; userId: string }

export function App() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let isCancelled = false
    ensureSession()
      .then(async (user) => {
        await seedMonitors()
        if (!isCancelled) setState({ status: 'ready', userId: user.id })
      })
      .catch((error: Error) => {
        if (!isCancelled) setState({ status: 'error', message: error.message })
      })
    return () => {
      isCancelled = true
    }
  }, [])

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-3 border-b border-line px-5 py-3">
        <div className="size-6 rounded-md bg-gradient-to-br from-emerald-400 to-sky-500" />
        <h1 className="text-[15px] font-medium">Uptime</h1>
        <span className="text-xs text-muted">Checked every 30 seconds</span>
        <div className="ml-auto">
          <ThemeSwitch />
        </div>
      </header>
      {state.status === 'loading' && <Centered>Setting up your monitors…</Centered>}
      {state.status === 'error' && <Centered>Couldn’t load: {state.message}</Centered>}
      {state.status === 'ready' && <Dashboard userId={state.userId} />}
    </div>
  )
}

function Dashboard({ userId }: { userId: string }) {
  const [since] = useState(() => new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString())

  // Live queries: as the worker records checks and opens or resolves
  // incidents, Realtime updates these and the dashboard re-renders.
  const { data: monitorList = [], isLoading } = useLiveQuery((q) =>
    q.from({ monitor: monitors }).orderBy(({ monitor }) => monitor.created_at)
  )
  const { data: recentChecks = [] } = useLiveQuery(
    (q) =>
      q
        .from({ check: checks })
        .where(({ check }) => gt(check.checked_at, since))
        .orderBy(({ check }) => check.checked_at),
    [since]
  )
  const { data: openIncidents = [] } = useLiveQuery((q) =>
    q.from({ incident: incidents }).where(({ incident }) => isNull(incident.resolved_at))
  )

  const checksByMonitor = Map.groupBy(recentChecks, (check) => check.monitor_id)
  const downCount = monitorList.filter((monitor) =>
    openIncidents.some((incident) => incident.monitor_id === monitor.id)
  ).length

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-5">
      <Summary total={monitorList.length} down={downCount} hasChecks={recentChecks.length > 0} />
      <AddMonitorForm userId={userId} isFull={monitorList.length >= 5} />
      {isLoading && <Centered>Loading monitors…</Centered>}
      <ul className="flex flex-col gap-3">
        {monitorList.map((monitor) => (
          <MonitorRow
            key={monitor.id}
            monitor={monitor}
            checks={checksByMonitor.get(monitor.id) ?? []}
            incident={openIncidents.find((incident) => incident.monitor_id === monitor.id)}
          />
        ))}
      </ul>
    </main>
  )
}

function Summary({ total, down, hasChecks }: { total: number; down: number; hasChecks: boolean }) {
  const isAllUp = down === 0
  if (!hasChecks) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
        <span className="size-2.5 rounded-full bg-line-strong" />
        <p className="text-sm">Running the first checks…</p>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
      <span
        className={`size-2.5 rounded-full ${isAllUp ? 'bg-emerald-500' : 'animate-pulse bg-red-500'}`}
      />
      <p className="text-sm">
        {isAllUp
          ? `All ${total} monitors are up`
          : `${down} of ${total} monitors ${down === 1 ? 'is' : 'are'} down`}
      </p>
    </div>
  )
}

function AddMonitorForm({ userId, isFull }: { userId: string; isFull: boolean }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    let parsed: URL
    try {
      parsed = new URL(url.includes('://') ? url : `https://${url}`)
    } catch {
      setError('Enter a full URL, like https://example.com')
      return
    }
    const transaction = monitors.insert({
      id: crypto.randomUUID(),
      name: parsed.hostname.replace(/^www\./, ''),
      url: parsed.toString(),
      is_paused: false,
      created_by: userId,
      created_at: new Date().toISOString(),
    })
    setUrl('')
    try {
      await transaction.isPersisted.promise
    } catch (insertError) {
      // The insert rolls back automatically; show Postgres's reason.
      setError(insertError instanceof Error ? insertError.message : 'Could not add monitor')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://your-site.com"
          aria-label="URL to monitor"
          disabled={isFull}
          className="flex-1 rounded-lg border border-line bg-card px-3 py-2 text-sm placeholder:text-muted focus:border-line-strong focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isFull || url.trim() === ''}
          className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40"
        >
          Add monitor
        </button>
      </div>
      {isFull && <p className="text-xs text-muted">You can have up to 5 monitors.</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  )
}

function MonitorRow({
  monitor,
  checks: monitorChecks,
  incident,
}: {
  monitor: Monitor
  checks: Check[]
  incident?: Incident
}) {
  const latest = monitorChecks.at(-1)
  const upCount = monitorChecks.filter((check) => check.is_up).length
  const uptime = monitorChecks.length > 0 ? (upCount / monitorChecks.length) * 100 : null
  const latencies = monitorChecks
    .map((check) => check.latency_ms)
    .filter((latency): latency is number => latency !== null)
  const averageLatency =
    latencies.length > 0
      ? Math.round(latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length)
      : null

  let status: 'paused' | 'pending' | 'down' | 'up' = 'up'
  if (monitor.is_paused) status = 'paused'
  else if (!latest) status = 'pending'
  else if (incident || !latest.is_up) status = 'down'

  return (
    <li className="group flex flex-col gap-3 rounded-xl border border-line bg-card p-4">
      <div className="flex items-center gap-3">
        <StatusDot status={status} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{monitor.name}</p>
          <a
            href={monitor.url}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-xs text-muted hover:text-foreground"
          >
            {monitor.url}
          </a>
        </div>
        <Stat label="Uptime (1h)" value={uptime === null ? '—' : `${uptime.toFixed(1)}%`} />
        <Stat label="Avg response" value={averageLatency === null ? '—' : `${averageLatency} ms`} />
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            onClick={() =>
              monitors.update(monitor.id, (draft) => {
                draft.is_paused = !draft.is_paused
              })
            }
            className="rounded-md border border-line px-2 py-1 text-xs hover:bg-hover"
          >
            {monitor.is_paused ? 'Resume' : 'Pause'}
          </button>
          <button
            type="button"
            aria-label={`Delete ${monitor.name}`}
            onClick={() => monitors.delete(monitor.id)}
            className="rounded-md border border-line px-2 py-1 text-xs hover:bg-hover"
          >
            Delete
          </button>
        </div>
      </div>
      <CheckBars checks={monitorChecks} />
      {status === 'pending' && (
        <p className="text-xs text-muted">Waiting for the first check…</p>
      )}
      {incident && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
          Down since {new Date(incident.started_at).toLocaleTimeString()} · {incident.cause}
        </p>
      )}
    </li>
  )
}

function CheckBars({ checks: monitorChecks }: { checks: Check[] }) {
  const recent = monitorChecks.slice(-BARS)
  const maxLatency = Math.max(500, ...recent.map((check) => check.latency_ms ?? 0))
  const slots = [...Array(BARS - recent.length).fill(null), ...recent] as (Check | null)[]

  return (
    <div className="flex h-8 items-end gap-0.5" aria-label="Recent checks">
      {slots.map((check, index) => {
        if (!check) return <span key={`empty-${index}`} className="h-1 flex-1 rounded-sm bg-line" />
        const height = check.is_up
          ? Math.max(35, ((check.latency_ms ?? 0) / maxLatency) * 100)
          : 100
        return (
          <span
            key={check.id}
            title={`${new Date(check.checked_at).toLocaleTimeString()} · ${
              check.is_up ? `${check.latency_ms} ms` : (check.error ?? `HTTP ${check.status_code}`)
            }`}
            className={`flex-1 rounded-sm ${check.is_up ? 'bg-emerald-500/80' : 'bg-red-500'}`}
            style={{ height: `${height}%` }}
          />
        )
      })}
    </div>
  )
}

function StatusDot({ status }: { status: 'paused' | 'pending' | 'down' | 'up' }) {
  const color = {
    up: 'bg-emerald-500',
    down: 'animate-pulse bg-red-500',
    pending: 'bg-line-strong',
    paused: 'bg-amber-400',
  }[status]
  return <span className={`size-2.5 shrink-0 rounded-full ${color}`} aria-label={status} />
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="hidden w-24 text-right sm:block">
      <p className="text-sm tabular-nums">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  )
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[40dvh] flex-1 items-center justify-center text-sm text-muted">
      {children}
    </div>
  )
}

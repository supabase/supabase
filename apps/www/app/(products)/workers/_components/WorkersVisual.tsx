'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Database } from 'icons'
import type { LucideIcon } from 'lucide-react'
import { Bot, Server, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from 'ui'

import styles from './workers-visual.module.css'
import { WorkersLogo } from './WorkersLogo'

// Ephemeral sandboxes cycle through this lifecycle on a loop: empty (no
// container running) -> building -> active -> stopping -> suspended -> empty.
// Durations are compressed relative to a real Worker's lifetime ("a few
// minutes" of activity becomes tens of seconds, etc.) so the loop stays
// watchable on a marketing page.
type SandboxPhase = 'empty' | 'building' | 'active' | 'stopping' | 'suspended'

const PHASE_ORDER: SandboxPhase[] = ['empty', 'building', 'active', 'stopping', 'suspended']

const PHASE_DURATION_MS: Record<SandboxPhase, [number, number]> = {
  empty: [3000, 6000],
  building: [2000, 4000],
  active: [18000, 32000],
  stopping: [800, 1600],
  suspended: [3000, 5000],
}

const STATUS_META: Record<
  Exclude<SandboxPhase, 'empty'>,
  { label: string; dot: string; text: string }
> = {
  building: { label: 'Building', dot: 'bg-warning animate-pulse', text: 'text-foreground' },
  active: { label: 'Active', dot: 'bg-brand', text: 'text-foreground' },
  stopping: { label: 'Stopping', dot: 'bg-warning', text: 'text-foreground-muted' },
  suspended: { label: 'Suspended', dot: 'bg-border-stronger', text: 'text-foreground-muted' },
}

const SANDBOX_RUNTIMES = ['node', 'deno'] as const

const SANDBOX_SLOTS = [
  { name: 'sandbox1', size: '2 GB · 1 vCPU', delay: 0 },
  { name: 'sandbox3', size: '2 GB · 1 vCPU', delay: 5500 },
  { name: 'sandbox2', size: '2 GB · 1 vCPU', delay: 9000 },
  { name: 'sandbox4', size: '4 GB · 2 vCPU', delay: 3000 },
] as const

const PERSISTENT_WORKERS = [
  { name: 'api', runtime: 'node', size: '2 GB · 1 vCPU', since: '2 months ago' },
  { name: 'embeddings', runtime: 'dockerfile', size: '4 GB · 2 vCPU', since: '3 days ago' },
] as const

function randomInRange([min, max]: [number, number]) {
  return min + Math.random() * (max - min)
}

function formatElapsed(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m${seconds % 60}s`
}

function useSandboxLifecycle(runtimes: readonly string[], initialDelayMs: number) {
  const prefersReducedMotion = useReducedMotion()
  const [phase, setPhase] = useState<SandboxPhase>('empty')
  const [elapsed, setElapsed] = useState(0)
  const [runtime, setRuntime] = useState<string>(runtimes[0])

  // Drives the phase machine: schedule the next phase, then reschedule
  // itself from there. Runtime is re-rolled each time a build starts.
  useEffect(() => {
    if (prefersReducedMotion) return

    let timeoutId: ReturnType<typeof setTimeout>

    const advance = (current: SandboxPhase) => {
      const next = PHASE_ORDER[(PHASE_ORDER.indexOf(current) + 1) % PHASE_ORDER.length]
      if (next === 'building') setRuntime(runtimes[Math.floor(Math.random() * runtimes.length)])
      setPhase(next)
      setElapsed(0)
      timeoutId = setTimeout(() => advance(next), randomInRange(PHASE_DURATION_MS[next]))
    }

    timeoutId = setTimeout(() => advance('empty'), initialDelayMs)
    return () => clearTimeout(timeoutId)
  }, [runtimes, initialDelayMs, prefersReducedMotion])

  // Ticks the elapsed-time counter shown in the card footer while the
  // sandbox is doing something worth timing.
  useEffect(() => {
    if (prefersReducedMotion || phase === 'empty' || phase === 'suspended') return
    const interval = setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => clearInterval(interval)
  }, [phase, prefersReducedMotion])

  if (prefersReducedMotion) return { phase: 'active' as const, elapsed: 96, runtime: runtimes[0] }
  return { phase, elapsed, runtime }
}

function WorkerIcon({ dimmed = false }: { dimmed?: boolean }) {
  return (
    <div
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border',
        dimmed ? 'text-foreground-muted opacity-30' : 'text-foreground-lighter'
      )}
    >
      <WorkersLogo size={16} />
    </div>
  )
}

function WorkerCardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col rounded-lg border border-border bg-surface-75 overflow-hidden">
      {children}
    </div>
  )
}

function WorkerCardHeader({
  name,
  runtime,
  statusSlot,
}: {
  name: string
  runtime: string
  statusSlot: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5">
      <WorkerIcon />
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate font-mono text-xs text-foreground">{name}</span>
        <span className="truncate font-mono text-[11px] text-foreground-muted">{runtime}</span>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1.5">{statusSlot}</div>
    </div>
  )
}

function WorkerCardFooter({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex bg-bg-surface-100 items-center justify-between border-t border-border px-3 py-2 font-mono text-xs text-foreground-muted">
      <span>{left}</span>
      <span>{right}</span>
    </div>
  )
}

// Always-on production backend worker: fixed status, no lifecycle.
function PersistentWorkerCard({ name, runtime, size, since }: (typeof PERSISTENT_WORKERS)[number]) {
  return (
    <WorkerCardShell>
      <WorkerCardHeader
        name={name}
        runtime={runtime}
        statusSlot={
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
            <span className="font-mono text-xs text-foreground">Active</span>
          </>
        }
      />
      <WorkerCardFooter left={size} right={since} />
    </WorkerCardShell>
  )
}

// Ephemeral sandbox worker: renders as a dashed empty slot until an agent
// spins it up, then crossfades into a live card that tracks its phase.
// Lifecycle state is lifted to the parent (see useSandboxLifecycle call
// sites in WorkersVisual) so the connector lines can react to it too.
function SandboxCard({
  name,
  size,
  phase,
  elapsed,
  runtime,
}: {
  name: string
  size: string
  phase: SandboxPhase
  elapsed: number
  runtime: string
}) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {phase === 'empty' ? (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex h-[69px] items-center justify-center rounded-lg border border-dashed border-border"
        >
          <WorkerIcon dimmed />
        </motion.div>
      ) : (
        <motion.div
          key="card"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.3 }}
        >
          <WorkerCardShell>
            <WorkerCardHeader
              name={name}
              runtime={runtime}
              statusSlot={
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={phase}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-1.5"
                  >
                    <span
                      className={cn('h-1.5 w-1.5 rounded-full', STATUS_META[phase].dot)}
                      aria-hidden
                    />
                    <span className={cn('font-mono text-xs', STATUS_META[phase].text)}>
                      {STATUS_META[phase].label}
                    </span>
                  </motion.span>
                </AnimatePresence>
              }
            />
            <WorkerCardFooter
              left={size}
              right={phase === 'suspended' ? '–' : formatElapsed(elapsed)}
            />
          </WorkerCardShell>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ApplicationCard() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-2.5">
      <Database className="h-4 w-4 text-foreground-lighter" strokeWidth={1.5} aria-hidden />
      <span className="font-mono text-xs uppercase tracking-widest text-foreground-lighter">
        Application
      </span>
    </div>
  )
}

function SourceCard({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed min-w-32 px-4 py-4">
      <Icon className="h-5 w-5 text-foreground-muted" strokeWidth={1.5} aria-hidden />
      <span className="font-mono text-xs uppercase tracking-widest text-foreground-muted">
        {label}
      </span>
    </div>
  )
}

// A single vertical link in the flow: a faint dashed base plus a brand-colored
// overlay that marches continuously (see .flow) and fades in only while the
// worker(s) it feeds are doing something — dark/idle otherwise.
function ConnectorLine({ active = true }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 2 24" preserveAspectRatio="none" className="h-full w-px" aria-hidden="true">
      <line
        x1="1"
        y1="0"
        x2="1"
        y2="24"
        className="text-border-strong"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="2 4"
      />
      <line
        x1="1"
        y1="0"
        x2="1"
        y2="24"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        className={cn('text-border-muted transition-opacity duration-700', styles.flow)}
        style={{ opacity: active ? 1 : 0 }}
      />
    </svg>
  )
}

const RUNTIMES = [
  { name: 'Dockerfile', available: true },
  { name: 'Node', available: true },
  { name: 'Deno 2.9', available: true },
  { name: 'Bun', available: false },
  { name: 'Python', available: false },
]

export function WorkersVisual() {
  // Lifecycle state for the 4 sandbox slots, lifted up here so the connector
  // lines below can react to whichever sandboxes they feed.
  const sandbox1 = useSandboxLifecycle(SANDBOX_RUNTIMES, SANDBOX_SLOTS[0].delay)
  const sandbox3 = useSandboxLifecycle(SANDBOX_RUNTIMES, SANDBOX_SLOTS[1].delay)
  const sandbox2 = useSandboxLifecycle(SANDBOX_RUNTIMES, SANDBOX_SLOTS[2].delay)
  const sandbox4 = useSandboxLifecycle(SANDBOX_RUNTIMES, SANDBOX_SLOTS[3].delay)

  return (
    <figure className="w-full max-w-3xl mx-auto flex flex-col gap-2 py-8">
      <span className="sr-only">
        A diagram showing humans and agents connecting to Workers. Two always-on backend Workers
        serve the application; agents spin up short-lived sandbox Workers on demand, which build,
        run, and suspend automatically.
      </span>

      <div className="grid grid-cols-3 gap-x-2" aria-hidden="true">
        <div className="flex col-span-full justify-center">
          <ApplicationCard />
        </div>

        <div className="col-span-full h-12">
          <ConnectorLine active />
        </div>

        <PersistentWorkerCard {...PERSISTENT_WORKERS[0]} />
        <SandboxCard name={SANDBOX_SLOTS[0].name} size={SANDBOX_SLOTS[0].size} {...sandbox1} />
        <SandboxCard name={SANDBOX_SLOTS[1].name} size={SANDBOX_SLOTS[1].size} {...sandbox3} />

        <div className="col-span-full h-2">
          <ConnectorLine active />
        </div>

        <PersistentWorkerCard {...PERSISTENT_WORKERS[1]} />
        <SandboxCard name={SANDBOX_SLOTS[2].name} size={SANDBOX_SLOTS[2].size} {...sandbox2} />
        <SandboxCard name={SANDBOX_SLOTS[3].name} size={SANDBOX_SLOTS[3].size} {...sandbox4} />

        <div className="w-full flex col-span-full h-12">
          <ConnectorLine active />
          <ConnectorLine active={sandbox2.phase !== 'empty'} />
          <ConnectorLine active={sandbox4.phase !== 'empty'} />
        </div>

        {/* Sources */}
        <div className="col-span-full flex justify-center gap-2">
          <SourceCard icon={User} label="Human" />
          <SourceCard icon={Bot} label="Agent 1" />
          <SourceCard icon={Bot} label="Agent 2" />
        </div>
      </div>
    </figure>
  )
}

'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Database } from 'icons'
import type { LucideIcon } from 'lucide-react'
import { Bot, User } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { cn } from 'ui'

import styles from './workers-visual.module.css'
import { WorkersLogo } from './WorkersLogo'

// Ephemeral sandboxes cycle through this lifecycle on a loop: empty (no
// container running) -> deploying -> active -> stopping -> suspending -> empty.
// Durations are compressed relative to a real Worker's lifetime ("a few
// minutes" of activity becomes tens of seconds, etc.) so the loop stays
// watchable on a marketing page.
type SandboxPhase = 'empty' | 'deploying' | 'active' | 'stopping' | 'suspending'

const PHASE_ORDER: SandboxPhase[] = ['empty', 'deploying', 'active', 'stopping', 'suspending']

const PHASE_DURATION_MS: Record<SandboxPhase, [number, number]> = {
  empty: [3000, 6000],
  deploying: [2000, 4000],
  active: [18000, 32000],
  stopping: [800, 1600],
  suspending: [3000, 5000],
}

const STATUS_META: Record<
  Exclude<SandboxPhase, 'empty'>,
  { label: string; dot: string; text: string }
> = {
  deploying: { label: 'Deploying', dot: 'bg-warning animate-pulse', text: 'text-foreground' },
  active: { label: 'Active', dot: 'bg-brand', text: 'text-foreground' },
  stopping: { label: 'Stopping', dot: 'bg-warning', text: 'text-foreground-muted' },
  suspending: { label: 'Suspending', dot: 'bg-border-stronger', text: 'text-foreground-muted' },
}

const SANDBOX_RUNTIMES = ['node', 'deno'] as const

// Names read like something an agent platform could generate per run
const SANDBOX_WORKLOADS = [
  'brainstorm',
  'plan',
  'prototype',
  'demo',
  'explore',
  'research',
  'spike',
  'draft',
  'scaffold',
  'smoosh',
  'review',
  'support',
  'tests',
  'e2e',
  'build',
  'scrape',
  'crawl',
  'migrate',
  'seed',
  'bench',
  'index',
  'parse',
  'render',
] as const

// The name each slot renders on the server and on first paint. Names are only
// ever re-rolled later, from the lifecycle effect, so hydration stays stable.
const SANDBOX_SLOTS = [
  { name: 'review-4f2a', size: '2 GB · 1 vCPU', delay: 0 },
  { name: 'plan-9be0', size: '2 GB · 1 vCPU', delay: 5500 },
  { name: 'scrape-7c31', size: '2 GB · 1 vCPU', delay: 9000 },
  { name: 'migrate-2d8a', size: '4 GB · 2 vCPU', delay: 3000 },
] as const

const PERSISTENT_WORKERS = [
  { name: 'api', runtime: 'node', size: '2 GB · 1 vCPU', since: '2mo ago' },
  { name: 'embeddings', runtime: 'dockerfile', size: '4 GB · 2 vCPU', since: '3d ago' },
] as const

function randomInRange([min, max]: [number, number]) {
  return min + Math.random() * (max - min)
}

function randomItem<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)]
}

// Two sandboxes can legitimately run the same workload, so the run id — not
// the prefix — is what keeps names distinct on screen.
function randomSandboxName() {
  const runId = Math.floor(Math.random() * 0x10000)
    .toString(16)
    .padStart(4, '0')
  return `${randomItem(SANDBOX_WORKLOADS)}-${runId}`
}

function formatElapsed(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m${seconds % 60}s`
}

function useSandboxLifecycle(
  runtimes: readonly string[],
  { name: initialName, delay: initialDelayMs }: (typeof SANDBOX_SLOTS)[number]
) {
  const prefersReducedMotion = useReducedMotion()
  const [phase, setPhase] = useState<SandboxPhase>('empty')
  const [elapsed, setElapsed] = useState(0)
  const [runtime, setRuntime] = useState<string>(runtimes[0])
  const [name, setName] = useState<string>(initialName)

  // Drives the phase machine: schedule the next phase, then reschedule
  // itself from there. Each deploy is a different sandbox, so the name and
  // runtime are both re-rolled every time a build starts.
  useEffect(() => {
    if (prefersReducedMotion) return

    let timeoutId: ReturnType<typeof setTimeout>

    const advance = (current: SandboxPhase) => {
      const next = PHASE_ORDER[(PHASE_ORDER.indexOf(current) + 1) % PHASE_ORDER.length]
      if (next === 'deploying') {
        setName(randomSandboxName())
        setRuntime(randomItem(runtimes))
      }
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
    if (prefersReducedMotion || phase === 'empty' || phase === 'suspending') return
    const interval = setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => clearInterval(interval)
  }, [phase, prefersReducedMotion])

  if (prefersReducedMotion)
    return { phase: 'active' as const, elapsed: 96, runtime: runtimes[0], name: initialName }
  return { phase, elapsed, runtime, name }
}

function WorkerIcon({ dimmed = false }: { dimmed?: boolean }) {
  return (
    <div
      className={cn(
        'hidden sm:flex h-6 w-6 md:h-7 md:w-7 shrink-0 items-center justify-center rounded-md border border-border',
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
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <WorkerIcon />
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-xs text-foreground">{name}</span>
          <span className="truncate font-mono text-[11px] text-foreground-muted">{runtime}</span>
        </div>
      </div>
      <div className="hidden sm:ml-auto sm:flex shrink-0 items-center gap-1.5">{statusSlot}</div>
    </div>
  )
}

function WorkerCardFooter({
  left,
  right,
  className,
}: {
  left: string | React.ReactNode
  right: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'bg-surface-200 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-border px-3 py-2 font-mono text-xs text-foreground-muted',
        className
      )}
    >
      <span className="flex items-center gap-1.5">{left}</span>
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
            <span className="text-xs text-foreground">Active</span>
          </>
        }
      />
      <WorkerCardFooter className="hidden sm:flex" left={size} right={since} />
      <WorkerCardFooter
        className="sm:hidden"
        left={
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
            <span className="text-xs text-foreground">Active</span>
          </>
        }
        right={since}
      />
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
          className="flex h-full items-center justify-center rounded-lg border border-dashed border-border"
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
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 2 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-1.5"
                  >
                    <span
                      className={cn('h-1.5 w-1.5 rounded-full', STATUS_META[phase].dot)}
                      aria-hidden
                    />
                    <span className={cn('text-xs', STATUS_META[phase].text)}>
                      {STATUS_META[phase].label}
                    </span>
                  </motion.span>
                </AnimatePresence>
              }
            />
            <WorkerCardFooter
              className="hidden sm:flex"
              left={size}
              right={phase === 'suspending' ? '–' : formatElapsed(elapsed)}
            />
            <WorkerCardFooter
              className="sm:hidden"
              left={
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={phase}
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 2 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-1.5"
                  >
                    <span
                      className={cn('h-1.5 w-1.5 rounded-full', STATUS_META[phase].dot)}
                      aria-hidden
                    />
                    <span className={cn('text-xs', STATUS_META[phase].text)}>
                      {STATUS_META[phase].label}
                    </span>
                  </motion.span>
                </AnimatePresence>
              }
              right={phase === 'suspending' ? '–' : formatElapsed(elapsed)}
            />
          </WorkerCardShell>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ApplicationCard() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-foreground-muted/30 border-dashed px-4 py-2.5">
      <Database className="h-4 w-4 text-foreground-lighter" strokeWidth={1.5} aria-hidden />
      <span className="font-mono text-xs uppercase tracking-widest text-foreground-lighter">
        Application
      </span>
    </div>
  )
}

function SourceCard({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-foreground-muted/30 border-dashed sm:min-w-32 px-4 py-2 sm:py-4 gap-1 sm:gap-2">
      <Icon className="h-5 w-5 text-foreground-muted" strokeWidth={1.5} aria-hidden />
      <span className="font-mono text-xs uppercase tracking-widest text-foreground-muted">
        {label}
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Connectors
 *
 * The dashed lines are drawn in a single SVG overlay instead of being
 * baked into the layout, so they stay correct at any width: every card
 * is measured, each connector is routed between two measured centers,
 * and the whole layer is masked by the card rectangles. Masking is what
 * lets a connector be anchored at a card's center — the line is trimmed
 * exactly at the card's edge, so it reads as plugging into the card.
 * ------------------------------------------------------------------ */

type NodeKey =
  | 'app'
  | 'api'
  | 'embeddings'
  | 'sandboxTopMid'
  | 'sandboxBottomMid'
  | 'sandboxTopRight'
  | 'sandboxBottomRight'
  | 'human'
  | 'agent1'
  | 'agent2'

type Box = { x: number; y: number; width: number; height: number }
type Point = { x: number; y: number }
type Geometry = { width: number; height: number; boxes: Partial<Record<NodeKey, Box>> }
type Connector = { id: string; d: string; active: boolean }

const CORNER_RADIUS = 14
const CARD_RADIUS = 8

// Measures every registered node relative to the container and re-measures
// on any resize (viewport, font load, a card changing size).
function useDiagramGeometry() {
  const containerRef = useRef<HTMLElement | null>(null)
  const nodesRef = useRef(new Map<NodeKey, HTMLElement>())
  const [geometry, setGeometry] = useState<Geometry | null>(null)

  const registerNode = useCallback(
    (key: NodeKey) => (element: HTMLElement | null) => {
      if (element) nodesRef.current.set(key, element)
      else nodesRef.current.delete(key)
    },
    []
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const measure = () => {
      const base = container.getBoundingClientRect()
      const boxes: Partial<Record<NodeKey, Box>> = {}
      nodesRef.current.forEach((element, key) => {
        const rect = element.getBoundingClientRect()
        boxes[key] = {
          x: rect.left - base.left,
          y: rect.top - base.top,
          width: rect.width,
          height: rect.height,
        }
      })
      const next = { width: base.width, height: base.height, boxes }
      // Bail out on no-op measurements: ResizeObserver fires once per
      // observed element on setup, and each of those would re-render.
      setGeometry((current) =>
        current && JSON.stringify(current) === JSON.stringify(next) ? current : next
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    nodesRef.current.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  return { containerRef, registerNode, geometry }
}

function distance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function towards(from: Point, to: Point, length: number): Point {
  const total = distance(from, to)
  if (total === 0) return from
  return {
    x: from.x + ((to.x - from.x) * length) / total,
    y: from.y + ((to.y - from.y) * length) / total,
  }
}

// Orthogonal polyline with rounded corners — the classic diagram elbow.
function roundedPath(points: Point[], radius = CORNER_RADIUS) {
  const waypoints = points.filter(
    (point, index) => index === 0 || distance(points[index - 1], point) > 0.5
  )
  if (waypoints.length < 2) return ''

  let d = `M ${waypoints[0].x} ${waypoints[0].y}`
  for (let index = 1; index < waypoints.length - 1; index++) {
    const previous = waypoints[index - 1]
    const corner = waypoints[index]
    const next = waypoints[index + 1]
    const cornerRadius = Math.min(
      radius,
      distance(previous, corner) / 2,
      distance(corner, next) / 2
    )
    if (cornerRadius < 0.5) {
      d += ` L ${corner.x} ${corner.y}`
      continue
    }
    const entry = towards(corner, previous, cornerRadius)
    const exit = towards(corner, next, cornerRadius)
    d += ` L ${entry.x} ${entry.y} Q ${corner.x} ${corner.y} ${exit.x} ${exit.y}`
  }
  const last = waypoints[waypoints.length - 1]
  return `${d} L ${last.x} ${last.y}`
}

// Routes every connector from the measured layout: one line per column from
// its source card up into the bottom Worker card, plus the always-on column
// feeding the application. Anchoring at card centers and masking the card
// rectangles is what makes a line read as plugging into the card.
function buildConnectors(geometry: Geometry, live: Record<string, boolean>): Connector[] {
  const { boxes } = geometry
  const keys: NodeKey[] = [
    'app',
    'api',
    'embeddings',
    'sandboxBottomMid',
    'sandboxBottomRight',
    'human',
    'agent1',
    'agent2',
  ]
  if (keys.some((key) => !boxes[key])) return []

  const box = (key: NodeKey) => boxes[key] as Box
  const top = (key: NodeKey) => box(key).y
  const bottom = (key: NodeKey) => box(key).y + box(key).height
  const cx = (key: NodeKey) => box(key).x + box(key).width / 2
  const cy = (key: NodeKey) => box(key).y + box(key).height / 2
  const center = (key: NodeKey): Point => ({ x: cx(key), y: cy(key) })
  const at = (x: number, y: number): Point => ({ x, y })

  // Horizontal bands: the empty strips above and below the Worker grid, where
  // each connector makes its sideways jog.
  const sourceBand = (bottom('embeddings') + top('human')) / 2
  const appBand = (bottom('app') + top('api')) / 2

  const connector = (id: string, points: Point[], active = true): Connector => ({
    id,
    d: roundedPath(points),
    active,
  })

  return [
    // Each source feeds its own column.
    connector('human-embeddings', [
      center('human'),
      at(cx('human'), sourceBand),
      at(cx('embeddings'), sourceBand),
      center('embeddings'),
    ]),
    connector(
      'agent1-sandboxBottomMid',
      [
        center('agent1'),
        at(cx('agent1'), sourceBand),
        at(cx('sandboxBottomMid'), sourceBand),
        center('sandboxBottomMid'),
      ],
      live.sandboxBottomMid
    ),
    connector(
      'agent2-sandboxBottomRight',
      [
        center('agent2'),
        at(cx('agent2'), sourceBand),
        at(cx('sandboxBottomRight'), sourceBand),
        center('sandboxBottomRight'),
      ],
      live.sandboxBottomRight
    ),

    // The always-on column serves the application.
    connector('api-app', [
      center('api'),
      at(cx('api'), appBand),
      at(cx('app'), appBand),
      center('app'),
    ]),
  ]
}

// Faint dashed base for every connector, plus a brighter overlay that marches
// along the path (see .flow) and fades out while the Worker it feeds is idle.
function ConnectorLayer({
  geometry,
  live,
}: {
  geometry: Geometry | null
  live: Record<string, boolean>
}) {
  const maskId = `workers-connectors-mask-${useId()}`
  if (!geometry) return null

  const { width, height, boxes } = geometry
  const connectors = buildConnectors(geometry, live)
  if (!connectors.length) return null

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden="true"
    >
      <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={width} height={height}>
        <rect x="0" y="0" width={width} height={height} fill="white" />
        {Object.entries(boxes).map(([key, node]) => (
          <rect
            key={key}
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
            rx={CARD_RADIUS}
            fill="black"
          />
        ))}
      </mask>

      <g mask={`url(#${maskId})`}>
        {connectors.map((connector) => (
          <g key={connector.id}>
            <path
              d={connector.d}
              className="text-border-muted"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="2 4"
            />
            <path
              d={connector.d}
              className={cn(
                'text-foreground-muted/50 transition-opacity duration-100',
                styles.flow
              )}
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              style={{ opacity: connector.active ? 1 : 0 }}
            />
          </g>
        ))}
      </g>
    </svg>
  )
}

export function WorkersVisual() {
  // Lifecycle state for the 4 sandbox slots, lifted up here so the connector
  // lines below can react to whichever sandboxes they feed.
  const sandboxTopMid = useSandboxLifecycle(SANDBOX_RUNTIMES, SANDBOX_SLOTS[0])
  const sandboxTopRight = useSandboxLifecycle(SANDBOX_RUNTIMES, SANDBOX_SLOTS[1])
  const sandboxBottomMid = useSandboxLifecycle(SANDBOX_RUNTIMES, SANDBOX_SLOTS[2])
  const sandboxBottomRight = useSandboxLifecycle(SANDBOX_RUNTIMES, SANDBOX_SLOTS[3])

  const { containerRef, registerNode, geometry } = useDiagramGeometry()

  // A connector only flows while the sandbox it feeds is actually running.
  const isLive = (phase: SandboxPhase) => phase !== 'empty' && phase !== 'suspending'
  const live = {
    sandboxTopMid: isLive(sandboxTopMid.phase),
    sandboxBottomMid: isLive(sandboxBottomMid.phase),
    sandboxTopRight: isLive(sandboxTopRight.phase),
    sandboxBottomRight: isLive(sandboxBottomRight.phase),
  }

  return (
    <figure ref={containerRef} className="relative w-full max-w-3xl mx-auto py-8">
      <span className="sr-only">
        A diagram showing humans and agents connecting to Workers. Two always-on backend Workers
        serve the application; agents spin up short-lived sandbox Workers on demand, which build,
        run, and suspend automatically.
      </span>

      <div className="aspect-square -z-10 h-full inset-0 mx-auto absolute scale-200 bg-radial from-foreground-muted/5 via-transparent to-transparent" />

      <ConnectorLayer geometry={geometry} live={live} />

      <div className="relative grid grid-cols-3 gap-x-2" aria-hidden="true">
        <div className="flex col-span-full justify-center">
          <div ref={registerNode('app')}>
            <ApplicationCard />
          </div>
        </div>

        <div className="col-span-full h-12" />

        <div ref={registerNode('api')}>
          <PersistentWorkerCard {...PERSISTENT_WORKERS[0]} />
        </div>
        <div ref={registerNode('sandboxTopMid')} className="h-full">
          <SandboxCard size={SANDBOX_SLOTS[0].size} {...sandboxTopMid} />
        </div>
        <div ref={registerNode('sandboxTopRight')} className="h-full">
          <SandboxCard size={SANDBOX_SLOTS[1].size} {...sandboxTopRight} />
        </div>

        <div className="col-span-full h-2" />

        <div ref={registerNode('embeddings')}>
          <PersistentWorkerCard {...PERSISTENT_WORKERS[1]} />
        </div>
        <div ref={registerNode('sandboxBottomMid')} className="h-full">
          <SandboxCard size={SANDBOX_SLOTS[2].size} {...sandboxBottomMid} />
        </div>
        <div ref={registerNode('sandboxBottomRight')} className="h-full">
          <SandboxCard size={SANDBOX_SLOTS[3].size} {...sandboxBottomRight} />
        </div>

        <div className="col-span-full h-12" />

        {/* Sources */}
        <div className="col-span-full flex justify-center gap-2">
          <div ref={registerNode('human')}>
            <SourceCard icon={User} label="Human" />
          </div>
          <div ref={registerNode('agent1')}>
            <SourceCard icon={Bot} label="Agent 1" />
          </div>
          <div ref={registerNode('agent2')}>
            <SourceCard icon={Bot} label="Agent 2" />
          </div>
        </div>
      </div>
    </figure>
  )
}

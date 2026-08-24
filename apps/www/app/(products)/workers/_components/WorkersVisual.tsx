import { cn } from 'ui'

import styles from './workers-visual.module.css'

// The Workers mark: solid outer hexagon around an inner isometric cube (see WorkersLogo).
const WORKER_OUTER_PATH =
  'M15.75 12V5.99999C15.7497 5.73694 15.6803 5.4786 15.5487 5.25086C15.417 5.02312 15.2278 4.83401 15 4.70249L9.75 1.70249C9.52197 1.57084 9.2633 1.50153 9 1.50153C8.7367 1.50153 8.47803 1.57084 8.25 1.70249L3 4.70249C2.7722 4.83401 2.58299 5.02312 2.45135 5.25086C2.31971 5.4786 2.25027 5.73694 2.25 5.99999V12C2.25027 12.263 2.31971 12.5214 2.45135 12.7491C2.58299 12.9769 2.7722 13.166 3 13.2975L8.25 16.2975C8.47803 16.4291 8.7367 16.4985 9 16.4985C9.2633 16.4985 9.52197 16.4291 9.75 16.2975L15 13.2975C15.2278 13.166 15.417 12.9769 15.5487 12.7491C15.6803 12.5214 15.7497 12.263 15.75 12Z'
const WORKER_INNER_PATH =
  'M13 10.6011V7.4004C12.9998 7.26009 12.9587 7.12227 12.8807 7.00079C12.8027 6.8793 12.6906 6.77842 12.5556 6.70826L9.44444 5.10793C9.30932 5.0377 9.15603 5.00073 9 5.00073C8.84397 5.00073 8.69068 5.0377 8.55556 5.10793L5.44444 6.70826C5.30945 6.77842 5.19732 6.8793 5.11932 7.00079C5.04131 7.12227 5.00016 7.26009 5 7.4004V10.6011C5.00016 10.7414 5.04131 10.8792 5.11932 11.0007C5.19732 11.1222 5.30945 11.223 5.44444 11.2932L8.55556 12.8935C8.69068 12.9638 8.84397 13.0007 9 13.0007C9.15603 13.0007 9.30932 12.9638 9.44444 12.8935L12.5556 11.2932C12.6906 11.223 12.8027 11.1222 12.8807 11.0007C12.9587 10.8792 12.9998 10.7414 13 10.6011Z'
const WORKER_FACE_PATH = 'M6 7.00073L9 9.00073L12 7.00073'
const WORKER_STEM_PATH = 'M9 12.5V9.00073'

const WORKER_SCALE = 2.2
// half of the scaled 18x18 cube, to center it on (cx, cy)
const WORKER_OFFSET = (18 * WORKER_SCALE) / 2

function WorkerCube({
  cx,
  cy,
  className,
  style,
}: {
  cx: number
  cy: number
  className?: string
  style?: React.CSSProperties
}) {
  const strokeWidth = 1 / WORKER_SCALE
  return (
    <g transform={`translate(${cx - WORKER_OFFSET}, ${cy - WORKER_OFFSET}) scale(${WORKER_SCALE})`}>
      <g className={className} style={style}>
        <path d={WORKER_OUTER_PATH} strokeWidth={strokeWidth} />
        <path d={WORKER_INNER_PATH} strokeWidth={strokeWidth} strokeLinecap="square" />
        <path d={WORKER_FACE_PATH} strokeWidth={strokeWidth} strokeLinecap="square" />
        <path d={WORKER_STEM_PATH} strokeWidth={strokeWidth} strokeLinecap="square" />
      </g>
    </g>
  )
}

// Workers sit in a horizontal row above the boundary; humans and agents sit
// below it. Lines rise from each source, cross the dashed boundary, and
// attach to a worker for as long as it runs.
const WORKERS_Y = 140

// Long-lived workers: always on, steady traffic.
const PERSISTENT_WORKERS = [
  { cx: 300, in: 'M420 300 C 420 240, 300 230, 300 164' },
  { cx: 660, in: 'M540 300 C 540 240, 660 230, 660 164' },
]

// Short-lived workers: the line reaches the worker, stays while it runs,
// then retracts as the worker shuts down. Durations/delays are staggered
// so sessions overlap organically.
const EPHEMERAL_WORKERS = [
  { cx: 180, in: 'M540 300 C 540 220, 180 260, 180 164', duration: 9, delay: -2 },
  { cx: 420, in: 'M420 300 C 420 250, 420 220, 420 164', duration: 12, delay: -7 },
  { cx: 540, in: 'M540 300 C 540 250, 540 220, 540 164', duration: 8, delay: -5 },
  { cx: 780, in: 'M420 300 C 420 230, 780 250, 780 164', duration: 11, delay: -9.5 },
]

const RUNTIMES = [
  { name: 'Dockerfile', available: true },
  { name: 'Node', available: true },
  { name: 'Deno 2.9', available: true },
  { name: 'Bun', available: false },
  { name: 'Python', available: false },
]

export function WorkersVisual() {
  return (
    <figure className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      <span className="sr-only">
        Humans and agents spin up isolated Workers on demand. Some run briefly and shut down; others
        keep running indefinitely.
      </span>
      <svg viewBox="0 0 960 420" fill="none" className="w-full h-auto" aria-hidden="true">
        {/* Section labels */}
        <g className="text-foreground-muted font-mono" fill="currentColor" fontSize="11">
          <text x="480" y="56" textAnchor="middle" letterSpacing="0.1em">
            WORKERS
          </text>
          <text x="480" y="404" textAnchor="middle" letterSpacing="0.1em">
            HUMANS &amp; AGENTS
          </text>
        </g>

        {/* Dashed boundary between the worker row and the sources below */}
        <path
          d="M48 232 H 912"
          className="text-border-strong"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 6"
        />

        {/* Long-lived routes: faint base + steady dashed flow */}
        <g className="text-border-strong" stroke="currentColor" strokeWidth="1">
          {PERSISTENT_WORKERS.map((w) => (
            <path key={w.in} d={w.in} />
          ))}
        </g>
        <g className="text-brand" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round">
          {PERSISTENT_WORKERS.map((w) => (
            <path key={w.in} d={w.in} className={styles.flow} />
          ))}
        </g>

        {/* Short-lived sessions: line draws in, holds while the worker runs, then retracts */}
        <g
          className="text-brand"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          opacity="0.8"
        >
          {EPHEMERAL_WORKERS.map((w) => (
            <path
              key={w.in}
              d={w.in}
              pathLength={1}
              className={styles.sessionLine}
              style={{ animationDuration: `${w.duration}s`, animationDelay: `${w.delay}s` }}
            />
          ))}
        </g>

        {/* Source nodes: human and agent, icon only */}
        <g className="text-foreground-lighter">
          <rect
            x="388"
            y="300"
            width="64"
            height="64"
            rx="10"
            className="text-border"
            stroke="currentColor"
            fill="var(--background-surface-75)"
          />
          <text
            x="420"
            y="338"
            textAnchor="middle"
            fontSize="17"
            className="font-mono"
            fill="currentColor"
          >
            {'>_'}
          </text>
          <rect
            x="508"
            y="300"
            width="64"
            height="64"
            rx="10"
            className="text-border"
            stroke="currentColor"
            fill="var(--background-surface-75)"
          />
          <text
            x="540"
            y="339"
            textAnchor="middle"
            fontSize="19"
            className="font-mono"
            fill="currentColor"
          >
            ✳
          </text>
        </g>

        {/* Workers */}
        <g
          className="text-brand"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {PERSISTENT_WORKERS.map((w) => (
            <WorkerCube key={w.cx} cx={w.cx} cy={WORKERS_Y} />
          ))}
          {EPHEMERAL_WORKERS.map((w) => (
            <WorkerCube
              key={w.cx}
              cx={w.cx}
              cy={WORKERS_Y}
              className={styles.sessionWorker}
              style={{ animationDuration: `${w.duration}s`, animationDelay: `${w.delay}s` }}
            />
          ))}
        </g>
      </svg>

      {/* Runtimes */}
      <figcaption className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
        <span className="text-foreground-muted font-mono text-xs uppercase tracking-widest">
          Runtimes
        </span>
        <ul className="flex flex-wrap items-center justify-center gap-2">
          {RUNTIMES.map((runtime) => (
            <li
              key={runtime.name}
              className={cn(
                'flex items-center gap-2 rounded-full border border-border bg-surface-75 px-3 py-1.5 font-mono text-xs',
                runtime.available ? 'text-foreground-light' : 'text-foreground-muted'
              )}
            >
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  runtime.available ? 'bg-brand' : 'bg-border-stronger'
                )}
                aria-hidden
              />
              {runtime.name}
              {!runtime.available && (
                <span className="uppercase tracking-widest text-[9px] text-foreground-muted">
                  Soon
                </span>
              )}
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  )
}

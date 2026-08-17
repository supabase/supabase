import type {
  WorkerAccess,
  WorkerRuntime,
  WorkerSize,
  WorkerState,
} from './Workers.types'

/**
 * Region is locked to a single region at alpha — surfaced everywhere as
 * "US West (Oregon)" and non-editable. Kept as a constant so a future
 * multi-region rollout is a one-line change.
 */
export const WORKERS_REGION = 'us-west-1'
export const WORKERS_REGION_LABEL = 'US West (Oregon)'
export const WORKERS_REGION_SHORT = 'US West'

/** Public gateway URL pattern. Both public and private workers share this shape. */
export const workerGatewayUrl = (name: string) => `https://workers.supabase.co/v1/${name}`

export interface LockedWorkerProperty {
  label: string
  value: string
}

/**
 * Properties every worker gets that aren't configurable during Private Alpha —
 * shown on the create dialog so users know what's fixed vs. what they're
 * choosing. Source: Private Alpha requirements doc.
 */
export const LOCKED_WORKER_PROPERTIES: LockedWorkerProperty[] = [
  { label: 'Region', value: `${WORKERS_REGION_LABEL} (locked)` },
  { label: 'Persistent disk', value: 'None — stateless' },
  { label: 'Load balancing', value: 'Off' },
  { label: 'Max runtime', value: 'No limit (graceful drain)' },
  { label: 'Logs', value: 'Logflare' },
  { label: 'SSH access', value: 'Not supported' },
]

/** Per-project instance cap enforced at deploy time (mocked). */
export const WORKERS_INSTANCE_CAP = 100
export const WORKER_MIN_INSTANCES = 1
export const WORKER_MAX_INSTANCES = 10

export interface RuntimeMeta {
  value: WorkerRuntime
  /** Display label, e.g. "Python 3.14" */
  label: string
  /** CLI value passed to `--runtime` */
  cli: string
  /** Base container image, shown on the Settings tab */
  baseImage: string
  /** Inferred entrypoint, shown on the Settings tab */
  entrypoint: string
  /** Tailwind text color for the runtime swatch */
  swatchClassName: string
}

export const RUNTIMES: RuntimeMeta[] = [
  {
    value: 'node',
    label: 'Node.js 24',
    cli: 'node',
    baseImage: 'node:24-slim',
    entrypoint: 'node index.js',
    swatchClassName: 'bg-[#5FA04E]',
  },
  {
    value: 'deno',
    label: 'Deno 2',
    cli: 'deno',
    baseImage: 'denoland/deno:latest',
    entrypoint: 'deno run main.ts',
    swatchClassName: 'bg-[#70FFAF]',
  },
  {
    value: 'bun',
    label: 'Bun 1',
    cli: 'bun',
    baseImage: 'oven/bun:latest',
    entrypoint: 'bun run index.ts',
    swatchClassName: 'bg-[#FBF0DF]',
  },
  {
    value: 'python',
    label: 'Python 3.14',
    cli: 'python',
    baseImage: 'python:3.14-slim',
    entrypoint: 'python main.py',
    swatchClassName: 'bg-[#3776AB]',
  },
  {
    value: 'dockerfile',
    label: 'Dockerfile',
    cli: 'dockerfile',
    baseImage: 'From ./Dockerfile',
    entrypoint: 'CMD from Dockerfile',
    swatchClassName: 'bg-[#2496ED]',
  },
]

export const getRuntimeMeta = (runtime: WorkerRuntime): RuntimeMeta =>
  RUNTIMES.find((r) => r.value === runtime) ?? RUNTIMES[0]

export interface SizeMeta {
  value: WorkerSize
  memory: string
  vcpu: string
  /** e.g. "2×1 · 2 GB · 1 vCPU" */
  label: string
}

export const SIZES: SizeMeta[] = [
  { value: '2x1', memory: '2 GB', vcpu: '1 vCPU', label: '2×1 · 2 GB · 1 vCPU' },
  { value: '4x2', memory: '4 GB', vcpu: '2 vCPU', label: '4×2 · 4 GB · 2 vCPU' },
]

export const getSizeMeta = (size: WorkerSize): SizeMeta =>
  SIZES.find((s) => s.value === size) ?? SIZES[0]

/** Compact resources string for list rows, e.g. "1 vCPU · 2 GB · 1 inst". */
export const formatResources = (size: WorkerSize, instances: number): string => {
  const meta = getSizeMeta(size)
  return `${meta.vcpu} · ${meta.memory} · ${instances} inst`
}

export const ACCESS_OPTIONS: { value: WorkerAccess; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
]

export const LISTENING_PORT = 8080

export interface WorkerStateMeta {
  label: string
  /** Tailwind background for the status dot */
  dotClassName: string
  /** Tailwind text color for the label */
  textClassName: string
}

export const WORKER_STATE_META: Record<WorkerState, WorkerStateMeta> = {
  deploying: {
    label: 'Deploying',
    dotClassName: 'bg-warning',
    textClassName: 'text-foreground-light',
  },
  active: { label: 'Active', dotClassName: 'bg-brand', textClassName: 'text-foreground-light' },
  draining: {
    label: 'Draining',
    dotClassName: 'bg-warning',
    textClassName: 'text-foreground-light',
  },
  suspended: {
    label: 'Suspended',
    dotClassName: 'bg-foreground-muted',
    textClassName: 'text-foreground-light',
  },
  resuming: {
    label: 'Resuming',
    dotClassName: 'bg-warning',
    textClassName: 'text-foreground-light',
  },
  errored: {
    label: 'Errored',
    dotClassName: 'bg-destructive',
    textClassName: 'text-foreground-light',
  },
  killed: {
    label: 'Killed',
    dotClassName: 'bg-foreground-muted',
    textClassName: 'text-foreground-lighter',
  },
}

/** Human-readable copy for each error reason, used on Overview + log feed. */
export const WORKER_ERROR_REASON_LABEL: Record<string, string> = {
  crash: 'The worker crashed with a non-zero exit code',
  unresponsive: 'The worker did not respond on $PORT',
  build: 'The build failed before the worker could start',
  entrypoint: 'The entrypoint could not be found or executed',
  dependency: 'A dependency failed to install during build',
}

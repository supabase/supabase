import type { WorkerRuntime, WorkerSize, WorkerState } from './Workers.types'

// Locked to one region at alpha, so nothing in the UI lets you change it.
export const WORKERS_REGION = 'us-west-1'
export const WORKERS_REGION_LABEL = 'US West (Oregon)'
export const WORKERS_REGION_SHORT = 'US West'

// Private workers share this URL shape; access is enforced by the gateway, not the path.
export const workerGatewayUrl = (name: string) => `https://workers.supabase.co/v1/${name}`

export interface RuntimeMeta {
  value: WorkerRuntime
  label: string
  cli: string
  baseImage: string
  entrypoint: string
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
    value: 'dockerfile',
    label: 'Dockerfile',
    cli: 'dockerfile',
    baseImage: 'From ./Dockerfile',
    entrypoint: 'CMD from Dockerfile',
    swatchClassName: 'bg-[#2496ED]',
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
]

export const getRuntimeMeta = (runtime: WorkerRuntime): RuntimeMeta =>
  RUNTIMES.find((r) => r.value === runtime) ?? RUNTIMES[0]

export interface SizeMeta {
  value: WorkerSize
  memory: string
  vcpu: string
  label: string
}

export const SIZES: SizeMeta[] = [
  { value: '2x1', memory: '2 GB', vcpu: '1 vCPU', label: '2×1 · 2 GB · 1 vCPU' },
  { value: '4x2', memory: '4 GB', vcpu: '2 vCPU', label: '4×2 · 4 GB · 2 vCPU' },
]

export const getSizeMeta = (size: WorkerSize): SizeMeta =>
  SIZES.find((s) => s.value === size) ?? SIZES[0]

export const formatResources = (size: WorkerSize, instances: number): string => {
  const meta = getSizeMeta(size)
  return `${meta.vcpu} · ${meta.memory} · ${instances} inst`
}

export const LISTENING_PORT = 8080

export interface WorkerStateMeta {
  label: string
  dotClassName: string
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

export const WORKER_ERROR_REASON_LABEL: Record<string, string> = {
  crash: 'The worker crashed with a non-zero exit code',
  unresponsive: 'The worker did not respond on $PORT',
  build: 'The build failed before the worker could start',
  entrypoint: 'The entrypoint could not be found or executed',
  dependency: 'A dependency failed to install during build',
}

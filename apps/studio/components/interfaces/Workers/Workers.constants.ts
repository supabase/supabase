import type { Worker, WorkerBuildState } from './Workers.types'

// Locked to one region at alpha, so nothing in the UI lets you change it.
export const WORKERS_REGION = 'us-west-1'
export const WORKERS_REGION_LABEL = 'US West (Oregon)'
export const WORKERS_REGION_SHORT = 'US West'

// Private workers share this URL shape; access is enforced by the gateway, not the path.
export const workerGatewayUrl = (name: string) => `https://workers.supabase.co/v1/${name}`

export const LISTENING_PORT = 8080

export interface RuntimeMeta {
  label: string
  baseImage: string
  entrypoint: string
  swatchClassName: string
}

// Keyed by the `spec.runtime` values the Management API returns.
export const RUNTIMES: Record<string, RuntimeMeta> = {
  node: {
    label: 'Node.js 24',
    baseImage: 'node:24-slim',
    entrypoint: 'node index.js',
    swatchClassName: 'bg-[#5FA04E]',
  },
  deno: {
    label: 'Deno 2',
    baseImage: 'denoland/deno:latest',
    entrypoint: 'deno run main.ts',
    swatchClassName: 'bg-[#70FFAF]',
  },
  bun: {
    label: 'Bun 1',
    baseImage: 'oven/bun:latest',
    entrypoint: 'bun run index.ts',
    swatchClassName: 'bg-[#FBF0DF]',
  },
  python: {
    label: 'Python 3.14',
    baseImage: 'python:3.14-slim',
    entrypoint: 'python main.py',
    swatchClassName: 'bg-[#3776AB]',
  },
  dockerfile: {
    label: 'Dockerfile',
    baseImage: 'From ./Dockerfile',
    entrypoint: 'CMD from Dockerfile',
    swatchClassName: 'bg-[#2496ED]',
  },
}

export interface WorkerStateMeta {
  label: string
  dotClassName: string
  textClassName: string
}

const BUILD_STATE_META: Record<WorkerBuildState, WorkerStateMeta> = {
  building: {
    label: 'Building',
    dotClassName: 'bg-warning',
    textClassName: 'text-foreground-light',
  },
  active: { label: 'Active', dotClassName: 'bg-brand', textClassName: 'text-foreground-light' },
  failed: {
    label: 'Failed',
    dotClassName: 'bg-destructive',
    textClassName: 'text-foreground-light',
  },
}

const DELETING_STATE_META: WorkerStateMeta = {
  label: 'Deleting',
  dotClassName: 'bg-foreground-muted',
  textClassName: 'text-foreground-lighter',
}

export const getWorkerStateMeta = (worker: Worker): WorkerStateMeta =>
  worker.isDeleting ? DELETING_STATE_META : BUILD_STATE_META[worker.buildState]

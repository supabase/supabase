import type { ComputeInstance, ComputeInstanceBuildState } from './Compute.types'

// Locked to one region at alpha, so nothing in the UI lets you change it.
export const COMPUTE_REGION = 'us-west-2'
export const COMPUTE_REGION_LABEL = 'US West (Oregon)'
export const COMPUTE_REGION_SHORT = 'US West'

// Sizes are fixed at deploy time — matches the `size` values the API accepts.
export const COMPUTE_INSTANCE_SIZES = ['2gb-1vcpu', '4gb-2vcpu'] as const

export const COMPUTE_INSTANCE_NAME_WORDS = [
  'swift',
  'nimble',
  'brisk',
  'bold',
  'sleek',
  'vivid',
  'lucid',
  'crisp',
  'keen',
  'agile',
  'fierce',
  'bright',
  'orchid',
  'lotus',
  'iris',
  'dahlia',
  'tulip',
  'jasmine',
  'magnolia',
  'azalea',
  'poppy',
  'marigold',
  'hibiscus',
  'camellia',
  'synergy',
  'bloom',
  'scalable',
  'pivot',
  'paradigm',
  'holistic',
  'leverage',
  'stream',
  'viral',
  'turnkey',
  'quantum',
  'photon',
  'nebula',
  'comet',
  'orbit',
  'cosmos',
  'meteor',
  'pulsar',
  'quasar',
  'vector',
  'cipher',
  'nova',
  'zenith',
  'warp',
  'rocket',
  'stellar',
] as const

export const computeInstanceUrl = ({
  endpoint,
  protocol = 'https',
  name,
}: {
  endpoint: string | undefined
  protocol?: string
  name: string
}) => (endpoint ? `${protocol}://${endpoint}/compute/v1/${name}` : undefined)

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

export const COMPUTE_INSTANCE_DEPLOYABLE_RUNTIMES = ['node', 'deno', 'dockerfile'] as const

interface ComputeInstanceStateMeta {
  label: string
  dotClassName: string
  textClassName: string
}

const BUILD_STATE_META: Record<ComputeInstanceBuildState, ComputeInstanceStateMeta> = {
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

const DELETING_STATE_META: ComputeInstanceStateMeta = {
  label: 'Deleting',
  dotClassName: 'bg-foreground-muted',
  textClassName: 'text-foreground-lighter',
}

export const getComputeInstanceStateMeta = (instance: ComputeInstance): ComputeInstanceStateMeta =>
  instance.isDeleting ? DELETING_STATE_META : BUILD_STATE_META[instance.buildState]

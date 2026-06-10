/**
 * Get-started content engine — option metadata and config helpers.
 *
 * Ported from the Claude Design prototype's `data.js`. These are the typed
 * option tables that the step / file-tree / agent-plan builders read from.
 * Everything here is a pure function or a constant — no React.
 */

export type ProjectKind = 'new' | 'existing'
export type FrameworkId = 'nextjs' | 'vite' | 'tanstack' | 'none'
export type PrimitiveId = 'database' | 'auth' | 'storage' | 'functions' | 'dataapi' | 'realtime'
export type OrmId = 'none' | 'drizzle' | 'prisma'
export type ConnectionId = 'remote' | 'local'
export type AgentId = 'claude' | 'codex'

export interface StartConfig {
  project: ProjectKind
  framework: FrameworkId
  shadcn: boolean
  primitives: PrimitiveId[]
  orm: OrmId
  connection: ConnectionId
  agent: AgentId
  /** Explicit template IDs selected from the template catalog. */
  templateIds: string[]
}

export interface FrameworkMeta {
  id: FrameworkId
  label: string
  meta: string
  clientPkg: string
  envFile: string
  envPrefix: string
  ssr: boolean
  /** Suffix used to pick the right Supabase UI Library block variant. */
  shadcnTag: 'nextjs' | 'react'
  bootstrap: string
  utilsDir: string
}

export const FRAMEWORKS: Record<FrameworkId, FrameworkMeta> = {
  nextjs: {
    id: 'nextjs',
    label: 'Next.js',
    meta: 'App Router',
    clientPkg: '@supabase/supabase-js @supabase/ssr',
    envFile: '.env.local',
    envPrefix: 'NEXT_PUBLIC_',
    ssr: true,
    shadcnTag: 'nextjs',
    bootstrap: 'npx create-next-app -e with-supabase',
    utilsDir: 'utils/supabase',
  },
  vite: {
    id: 'vite',
    label: 'Vite + React',
    meta: 'SPA',
    clientPkg: '@supabase/supabase-js',
    envFile: '.env',
    envPrefix: 'VITE_',
    ssr: false,
    shadcnTag: 'react',
    bootstrap: 'npm create vite@latest my-app -- --template react-ts',
    utilsDir: 'src/lib',
  },
  tanstack: {
    id: 'tanstack',
    label: 'TanStack Start',
    meta: 'SSR',
    clientPkg: '@supabase/supabase-js @supabase/ssr',
    envFile: '.env',
    envPrefix: 'VITE_',
    ssr: true,
    shadcnTag: 'react',
    bootstrap: 'npx create-start-app@latest my-app',
    utilsDir: 'src/lib',
  },
  // Backend-only setup — no app framework, client library or UI blocks.
  none: {
    id: 'none',
    label: 'No front-end',
    meta: 'Backend only',
    clientPkg: '@supabase/supabase-js',
    envFile: '.env',
    envPrefix: '',
    ssr: false,
    shadcnTag: 'react',
    bootstrap: '',
    utilsDir: '',
  },
}

/** Whether the selected framework wires up an app front-end. */
export function hasFrontend(cfg: StartConfig): boolean {
  return cfg.framework !== 'none'
}

export interface PrimitiveMeta {
  id: PrimitiveId
  label: string
  blurb: string
}

export const PRIMITIVES: Record<PrimitiveId, PrimitiveMeta> = {
  database: { id: 'database', label: 'Database', blurb: 'Postgres' },
  auth: { id: 'auth', label: 'Auth', blurb: 'Users & sessions' },
  storage: { id: 'storage', label: 'Storage', blurb: 'Large files' },
  functions: { id: 'functions', label: 'Edge Functions', blurb: 'Serverless TS' },
  dataapi: { id: 'dataapi', label: 'Data API', blurb: 'Auto REST' },
  realtime: { id: 'realtime', label: 'Realtime', blurb: 'Live changes' },
}

export const PRIM_ORDER: PrimitiveId[] = [
  'database',
  'auth',
  'storage',
  'functions',
  'dataapi',
  'realtime',
]

/** Supabase UI Library (shadcn) blocks available per primitive. */
export const SHADCN_BLOCKS: Partial<Record<PrimitiveId, string>> = {
  auth: 'password-based-auth',
  storage: 'dropzone',
  realtime: 'realtime-cursor',
}

export interface OrmMeta {
  id: OrmId
  label: string
  meta: string
  schemaFile: string
}

export const ORMS: Record<OrmId, OrmMeta> = {
  none: {
    id: 'none',
    label: 'supabase-js',
    meta: 'Data API',
    schemaFile: 'supabase/schemas/todos.sql',
  },
  drizzle: { id: 'drizzle', label: 'Drizzle', meta: 'TS schema', schemaFile: 'src/db/schema.ts' },
  prisma: {
    id: 'prisma',
    label: 'Prisma',
    meta: 'schema.prisma',
    schemaFile: 'prisma/schema.prisma',
  },
}

export interface AgentMeta {
  id: AgentId
  label: string
  marketplace: string
  install: string
}

export const AGENTS: Record<AgentId, AgentMeta> = {
  claude: {
    id: 'claude',
    label: 'Claude Code',
    marketplace: 'claude plugin marketplace add supabase/supabase',
    install: 'claude plugin install supabase',
  },
  codex: {
    id: 'codex',
    label: 'Codex',
    marketplace: 'codex plugin marketplace add supabase/supabase',
    install: 'codex plugin install supabase',
  },
}

export const DEFAULT_CONFIG: StartConfig = {
  project: 'new',
  framework: 'nextjs',
  shadcn: true,
  primitives: ['database', 'auth'],
  orm: 'none',
  connection: 'remote',
  agent: 'claude',
  templateIds: ['todos'],
}

/** Join a list into a natural-language English string ("a, b and c"). */
export function listEnglish(items: string[]): string {
  if (items.length === 0) return 'no services yet'
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

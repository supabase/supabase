import type { CompositionResource } from './composition/resources'
import { selectedPrimitives, type StartComposition } from './composition/start-composition'
import {
  AGENTS,
  FRAMEWORKS,
  ORMS,
  PRIMITIVES,
  SHADCN_BLOCKS,
  type FrameworkId,
  type FrameworkMeta,
  type PrimitiveId,
  type StartConfig,
} from './config'
import type { FileTreeNode } from './file-tree'

export type GuideBlock =
  | { type: 'code'; lang: string; code: string }
  | { type: 'note'; text: string }
  | { type: 'filetree'; tree: FileTreeNode }

export interface GuideContext {
  cfg: StartConfig
  composition: StartComposition
  fw: FrameworkMeta
  frontend: boolean
  newProj: boolean
  newNext: boolean
  remote: boolean
  prims: PrimitiveId[]
  tables: Array<CompositionResource & { kind: 'table'; schema: string }>
  buckets: Array<CompositionResource & { kind: 'bucket' }>
}

export interface ReferenceDoc {
  label: string
  url: string
}

const lines = (arr: string[]) => arr.join('\n')
const fallbackUploadBucket = 'uploads'

export function createGuideContext(cfg: StartConfig, composition: StartComposition): GuideContext {
  const fw = FRAMEWORKS[cfg.framework]
  const frontend = fw.id !== 'none'
  const newProj = cfg.project === 'new'

  return {
    cfg,
    composition,
    fw,
    frontend,
    newProj,
    newNext: newProj && fw.id === 'nextjs',
    remote: cfg.connection === 'remote',
    prims: selectedPrimitives(cfg, composition),
    tables: composition.resources.filter(isTableResource).sort(compareTables),
    buckets: composition.resources.filter(isBucketResource).sort(compareResourcesByLabel),
  }
}

export function buildProjectCodeGuidanceBlocks(ctx: GuideContext): GuideBlock[] {
  const blocks: GuideBlock[] = []

  if (ctx.prims.includes('storage') && ctx.buckets.length === 0) {
    blocks.push({
      type: 'note',
      text: 'The core Storage template enables the service but does not create an application bucket. Add a storage feature template, or define a bucket and storage.objects policies in supabase/schemas/storage.sql before wiring uploads.',
    })

    if (ctx.prims.includes('auth')) {
      blocks.push({
        type: 'code',
        lang: 'supabase/schemas/storage.sql',
        code: lines([
          'insert into storage.buckets (id, name, public)',
          `values ('${fallbackUploadBucket}', '${fallbackUploadBucket}', false)`,
          'on conflict (id) do nothing;',
          '',
          'create policy "Users can upload their own files"',
          'on storage.objects for insert',
          'to authenticated',
          'with check (',
          `  bucket_id = '${fallbackUploadBucket}'`,
          '  and auth.uid()::text = (storage.foldername(name))[1]',
          ');',
          '',
          'create policy "Users can read their own files"',
          'on storage.objects for select',
          'to authenticated',
          'using (',
          `  bucket_id = '${fallbackUploadBucket}'`,
          '  and auth.uid()::text = (storage.foldername(name))[1]',
          ');',
        ]),
      })
    } else {
      blocks.push({
        type: 'note',
        text: 'For browser uploads, pair Storage with Auth so policies can scope files to the signed-in user. Without Auth, route uploads through trusted server-side code.',
      })
    }
  }

  if (ctx.prims.includes('dataapi') && ctx.tables.length === 0) {
    blocks.push({
      type: 'note',
      text: 'The Data API exposes configured schemas, but it does not create tables. Add a table template or declare your own RLS-protected tables before adding client queries.',
    })
  }

  return blocks
}

export function getShadcnBlockPrimitives(ctx: GuideContext): PrimitiveId[] {
  return ctx.prims.filter((primitive) => SHADCN_BLOCKS[primitive])
}

export function getShadcnBlockName(primitive: PrimitiveId): string | undefined {
  return SHADCN_BLOCKS[primitive]
}

export function getMissingShadcnPrimitiveLabels(ctx: GuideContext): string[] {
  return ctx.prims
    .filter(
      (primitive) => !SHADCN_BLOCKS[primitive] && !['database', 'functions'].includes(primitive)
    )
    .map((primitive) => PRIMITIVES[primitive].label)
}

export function buildAppPrimitiveBlocks(ctx: GuideContext): GuideBlock[] {
  return ctx.prims.flatMap((primitive) => buildPrimitiveAppBlocks(ctx, primitive))
}

export function buildAgentRules(ctx: GuideContext): string[] {
  const rules: string[] = []

  if (ctx.prims.includes('storage')) {
    if (ctx.buckets.length > 0) {
      rules.push(
        `Use the composed Storage bucket${ctx.buckets.length > 1 ? 's' : ''} (${ctx.buckets
          .map((bucket) => bucket.label)
          .join(', ')}) when wiring uploads; do not invent a different bucket name.`
      )
    } else {
      rules.push(
        'If uploads are needed, create the Storage bucket and storage.objects policies as SQL in supabase/schemas/storage.sql before adding app upload code.'
      )
    }
  }

  if (ctx.prims.includes('dataapi')) {
    rules.push(
      'For Data API queries, use RLS-protected tables in an exposed schema and keep anon/authenticated access scoped by policies.'
    )
  }

  if (ctx.prims.includes('auth')) {
    rules.push(
      'For Auth flows, read the current user on the server where the framework supports SSR.'
    )
  }

  return rules
}

export function buildReferenceDocs(ctx: GuideContext): ReferenceDoc[] {
  const docs: ReferenceDoc[] = []
  const seen = new Set<string>()
  const add = (label: string | undefined, url: string | undefined) => {
    if (label && url && !seen.has(url)) {
      seen.add(url)
      docs.push({ label, url })
    }
  }

  const frameworkDocs: Partial<Record<FrameworkId, ReferenceDoc>> = {
    nextjs: {
      label: 'Next.js quickstart',
      url: 'https://supabase.com/docs/guides/getting-started/quickstarts/nextjs',
    },
    vite: {
      label: 'React + Vite quickstart',
      url: 'https://supabase.com/docs/guides/getting-started/quickstarts/reactjs',
    },
    tanstack: {
      label: 'Getting started tutorials',
      url: 'https://supabase.com/docs/guides/getting-started/tutorials',
    },
  }

  const frameworkDoc = frameworkDocs[ctx.fw.id]
  add(frameworkDoc?.label, frameworkDoc?.url)
  add(
    `${AGENTS[ctx.cfg.agent].label} + Supabase MCP`,
    'https://supabase.com/docs/guides/getting-started/mcp'
  )
  add('Supabase CLI', 'https://supabase.com/docs/guides/local-development/cli/getting-started')
  if (ctx.cfg.connection === 'local') {
    add('Local development', 'https://supabase.com/docs/guides/local-development/overview')
  }
  if (ctx.cfg.shadcn) {
    add('Supabase UI Library', 'https://supabase.com/ui/docs/getting-started/introduction')
  }
  if (ctx.cfg.orm === 'none') {
    add(
      'Declarative database schemas',
      'https://supabase.com/docs/guides/local-development/declarative-database-schemas'
    )
  }
  if (ctx.cfg.orm === 'drizzle') {
    add('Drizzle with Supabase', 'https://orm.drizzle.team/docs/get-started/supabase-new')
  }
  if (ctx.cfg.orm === 'prisma') {
    add('Prisma with Supabase', 'https://supabase.com/docs/guides/database/prisma')
  }

  const primitiveDocs: Record<PrimitiveId, ReferenceDoc> = {
    database: { label: 'Database', url: 'https://supabase.com/docs/guides/database/overview' },
    auth: { label: 'Auth', url: 'https://supabase.com/docs/guides/auth' },
    storage: { label: 'Storage', url: 'https://supabase.com/docs/guides/storage' },
    functions: { label: 'Edge Functions', url: 'https://supabase.com/docs/guides/functions' },
    dataapi: { label: 'Data API (auto REST)', url: 'https://supabase.com/docs/guides/api' },
    realtime: { label: 'Realtime', url: 'https://supabase.com/docs/guides/realtime' },
  }
  for (const primitive of ctx.prims)
    add(primitiveDocs[primitive].label, primitiveDocs[primitive].url)

  add('Row Level Security', 'https://supabase.com/docs/guides/database/postgres/row-level-security')

  return docs
}

function buildPrimitiveAppBlocks(ctx: GuideContext, primitive: PrimitiveId): GuideBlock[] {
  switch (primitive) {
    case 'database':
    case 'functions':
      return []
    case 'auth':
      return buildAuthAppBlocks(ctx)
    case 'storage':
      return buildStorageAppBlocks(ctx)
    case 'dataapi':
      return buildDataApiAppBlocks(ctx)
    case 'realtime':
      return buildRealtimeAppBlocks(ctx)
  }
}

function buildAuthAppBlocks(ctx: GuideContext): GuideBlock[] {
  const localAuthNote = getLocalAuthNote(ctx)

  if (ctx.newNext) {
    return [
      {
        type: 'note',
        text: 'Email sign-in already works in the with-supabase starter. Tweak providers in Dashboard -> Authentication -> Providers; the login UI lives in app/login.',
      },
      ...localAuthNote,
    ]
  }

  if (ctx.cfg.shadcn) {
    return [
      {
        type: 'note',
        text: 'Use the password-based auth block for sign-in, sign-up and reset flows. Restyle it like any shadcn component.',
      },
      ...localAuthNote,
    ]
  }

  return [
    {
      type: 'code',
      lang: 'tsx',
      code: lines([
        'const { data, error } = await supabase.auth.signInWithPassword({',
        '  email, password,',
        '})',
      ]),
    },
    ...localAuthNote,
  ]
}

function getLocalAuthNote(ctx: GuideContext): GuideBlock[] {
  if (ctx.cfg.connection !== 'local') return []

  return [
    {
      type: 'note',
      text: 'For local email auth, open the Mailpit URL from npx supabase status. If email confirmations are disabled, no confirmation email is sent; keep the signup UI and redirect URLs aligned with supabase/config.toml, including localhost and 127.0.0.1 variants when your app may use both.',
    },
  ]
}

function buildStorageAppBlocks(ctx: GuideContext): GuideBlock[] {
  const bucket = ctx.buckets[0]
  const hasAuth = ctx.prims.includes('auth')

  if (!bucket) {
    if (hasAuth && ctx.cfg.shadcn) {
      return [
        {
          type: 'note',
          text: `Use the Dropzone block for uploads to the ${fallbackUploadBucket} bucket after adding the bucket and policies in Supabase code.`,
        },
      ]
    }

    if (hasAuth) {
      return [
        {
          type: 'code',
          lang: 'tsx',
          code: lines([
            'const path = `${user.id}/${file.name}`',
            `await supabase.storage.from('${fallbackUploadBucket}').upload(path, file)`,
          ]),
        },
      ]
    }

    return [
      {
        type: 'note',
        text: ctx.cfg.shadcn
          ? 'Use the Dropzone block after you add Auth, a Storage bucket and storage.objects policies in Supabase code.'
          : 'Add Auth, a Storage bucket and storage.objects policies before calling supabase.storage.from(...).upload(...) from the app.',
      },
    ]
  }

  if (ctx.cfg.shadcn) {
    return [
      {
        type: 'note',
        text: `Use the Dropzone block for uploads to the ${bucket.label} bucket. The bucket and policies come from ${bucket.sourceFilePath}.`,
      },
    ]
  }

  return [
    {
      type: 'code',
      lang: 'tsx',
      code: `await supabase.storage.from('${bucket.label}').upload(path, file)`,
    },
  ]
}

function buildDataApiAppBlocks(ctx: GuideContext): GuideBlock[] {
  const table = ctx.tables[0]

  if (!table) {
    return [
      {
        type: 'note',
        text: 'Create an RLS-protected table in an exposed schema before adding Data API queries to the app.',
      },
    ]
  }

  const blocks: GuideBlock[] = [
    {
      type: 'code',
      lang: 'tsx',
      code: lines([
        'const { data, error } = await supabase',
        `  .from('${table.label}')`,
        "  .select('*')",
      ]),
    },
  ]

  if (ctx.cfg.orm !== 'none') {
    blocks.push({
      type: 'note',
      text: `Prefer typed queries? Run the same read through ${ORMS[ctx.cfg.orm].label} - the Data API and your ORM share the one Postgres database.`,
    })
  }

  return blocks
}

function buildRealtimeAppBlocks(ctx: GuideContext): GuideBlock[] {
  if (ctx.cfg.shadcn) {
    return [
      {
        type: 'note',
        text: 'Use the Realtime Cursor block for live presence, or subscribe directly with the client.',
      },
    ]
  }

  const table = ctx.tables[0]

  if (!table) {
    return [
      {
        type: 'note',
        text: 'Create an RLS-protected table before subscribing to database changes from the app.',
      },
    ]
  }

  return [
    {
      type: 'code',
      lang: 'tsx',
      code: lines([
        'supabase',
        `  .channel('${table.label}')`,
        "  .on('postgres_changes',",
        `    { event: '*', schema: '${table.schema}', table: '${table.label}' },`,
        '    (payload) => console.log(payload))',
        '  .subscribe()',
      ]),
    },
  ]
}

function isTableResource(resource: CompositionResource): resource is CompositionResource & {
  kind: 'table'
  schema: string
} {
  return resource.kind === 'table' && Boolean(resource.schema)
}

function isBucketResource(
  resource: CompositionResource
): resource is CompositionResource & { kind: 'bucket' } {
  return resource.kind === 'bucket'
}

function compareTables(
  a: CompositionResource & { kind: 'table'; schema: string },
  b: CompositionResource & { kind: 'table'; schema: string }
): number {
  if (a.schema === 'public' && b.schema !== 'public') return -1
  if (a.schema !== 'public' && b.schema === 'public') return 1
  return compareResourcesByLabel(a, b)
}

function compareResourcesByLabel(a: CompositionResource, b: CompositionResource): number {
  return a.label.localeCompare(b.label)
}

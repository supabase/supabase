/**
 * Builds the live setup guide steps from the current config.
 * Ported from the prototype's `manualSteps()` and its step builders.
 *
 * Per-feature steps are sourced from the `templates` package (see `features.ts`),
 * so the feature content stays in sync with the www composer.
 */
import {
  AGENTS,
  FRAMEWORKS,
  ORMS,
  PRIMITIVES,
  SHADCN_BLOCKS,
  type FrameworkMeta,
  type PrimitiveId,
  type StartConfig,
} from './config'
import { selectedFeatures, selectedPrims, type StartFeature } from './features'
import { buildFileTree, type FileTreeNode } from './file-tree'

export type StepBlock =
  | { type: 'code'; lang: string; code: string }
  | { type: 'note'; text: string }
  | { type: 'filetree'; tree: FileTreeNode }

export interface SetupStep {
  id: string
  /** Brand-highlighted step number (a "key" setup action). */
  key?: boolean
  /** Renders the "feature" pill — a composed additional feature. */
  feature?: boolean
  title: string
  desc?: string
  blocks: StepBlock[]
}

const lines = (arr: string[]) => arr.join('\n')

export function buildSteps(cfg: StartConfig, features: StartFeature[]): SetupStep[] {
  const fw = FRAMEWORKS[cfg.framework]
  const frontend = fw.id !== 'none'
  const prims = selectedPrims(cfg, features)
  const newProj = cfg.project === 'new'
  const newNext = newProj && fw.id === 'nextjs'
  const remote = cfg.connection === 'remote'
  const steps: SetupStep[] = []

  // A) create app (new project with a front-end framework)
  if (newProj && frontend) steps.push(bootstrapStep(fw, newNext))

  // B) install the agent plugin (always — bundles MCP + skills)
  steps.push(pluginStep(cfg))

  // C) install the CLI (always — code-first migrations run through it)
  steps.push(cliStep(cfg))

  // D) existing: add Supabase (file tree OR shadcn blocks)
  if (!newProj) steps.push(cfg.shadcn ? shadcnAddStep(fw, prims) : fileTreeStep(cfg, features))

  // E) keys / project / link
  steps.push(keysStep(cfg, fw, newNext, remote))

  // F) install + client (front-end only; the Next.js starter already ships them)
  if (frontend && !newNext) {
    steps.push(installStep(fw))
    steps.push(clientStep(fw))
  }

  // G) ORM packages
  if (cfg.orm !== 'none') steps.push(ormInstallStep(cfg))

  // H) shadcn init (new projects only — existing handled in step D)
  if (cfg.shadcn && newProj) {
    steps.push({
      id: 'shadcn',
      title: 'Set up shadcn/ui',
      desc: "Initialise shadcn so you can drop in Supabase's prebuilt UI blocks.",
      blocks: [{ type: 'code', lang: 'terminal', code: 'npx shadcn@latest init' }],
    })
  }

  // I) per primitive
  for (const p of prims) steps.push(primStep(p, cfg, fw, newNext))

  // J) composite features — one multi-file step each, from the templates package
  for (const feature of selectedFeatures(cfg, features)) steps.push(featureStep(feature))

  return steps
}

/** Builds a step from a templates-package feature (renders all its files). */
function featureStep(feature: StartFeature): SetupStep {
  return {
    id: `f-${feature.id}`,
    feature: true,
    title: `Add ${feature.name}`,
    desc: feature.description,
    blocks: feature.template.files.map((file) => ({
      type: 'code',
      lang: file.path,
      code: file.content,
    })),
  }
}

function bootstrapStep(fw: FrameworkMeta, newNext: boolean): SetupStep {
  const blocks: StepBlock[] = [{ type: 'code', lang: 'terminal', code: fw.bootstrap }]
  if (newNext) {
    blocks.push({
      type: 'note',
      text: 'The with-supabase template already ships the Supabase client, an .env.example and a working email auth flow — so a few steps below are already done for you.',
    })
  }
  return {
    id: 'bootstrap',
    key: true,
    title: `Create your ${fw.label} app`,
    desc: 'Scaffold a fresh project to build on.',
    blocks,
  }
}

function pluginStep(cfg: StartConfig): SetupStep {
  const a = AGENTS[cfg.agent]
  return {
    id: 'plugin',
    key: true,
    title: `Install the Supabase plugin for ${a.label}`,
    desc: 'One install gives your agent everything — no hand-written mcp.json.',
    blocks: [
      { type: 'code', lang: 'terminal', code: lines([a.marketplace, a.install]) },
      {
        type: 'note',
        text: `The plugin bundles the Supabase MCP server and agent skills, so ${a.label} can create projects, run migrations and query your database for you. Ask it for an access token when prompted — it's never written to your repo.`,
      },
    ],
  }
}

function cliStep(cfg: StartConfig): SetupStep {
  const local = cfg.connection === 'local'
  const code = lines(
    ['npm install supabase --save-dev', 'npx supabase init'].concat(
      local ? ['npx supabase start'] : []
    )
  )
  return {
    id: 'cli',
    key: true,
    title: 'Install the Supabase CLI',
    desc: local
      ? 'Run the full stack — Postgres, Auth, Storage and Studio — locally in Docker.'
      : 'Code-first migrations are generated and pushed through the CLI.',
    blocks: [
      { type: 'code', lang: 'terminal', code },
      {
        type: 'note',
        text: local
          ? 'supabase start prints your local API URL and anon key — keep them for the keys step below.'
          : "You'll run supabase db diff / db push here to version your schema against your hosted project.",
      },
    ],
  }
}

function shadcnAddStep(fw: FrameworkMeta, prims: PrimitiveId[]): SetupStep {
  const blocks: StepBlock[] = [
    {
      type: 'code',
      lang: 'terminal',
      code: "npx shadcn@latest init   # if shadcn isn't set up yet",
    },
  ]
  const cmds = prims
    .filter((p) => SHADCN_BLOCKS[p])
    .map((p) => `npx shadcn@latest add @supabase/${SHADCN_BLOCKS[p]}-${fw.shadcnTag}`)
  if (cmds.length) blocks.push({ type: 'code', lang: 'terminal', code: lines(cmds) })

  const missing = prims.filter((p) => !SHADCN_BLOCKS[p])
  if (missing.length) {
    blocks.push({
      type: 'note',
      text:
        missing.map((p) => PRIMITIVES[p].label).join(', ') +
        (missing.length > 1
          ? " have no prebuilt blocks — they're added in code in the steps below."
          : " has no prebuilt block — it's added in code in the steps below."),
    })
  }
  return {
    id: 'add',
    key: true,
    title: 'Add Supabase UI blocks',
    desc: 'Drop ready-made, fully styled blocks straight into your existing app — wired to Supabase and restylable like any shadcn component.',
    blocks,
  }
}

function fileTreeStep(cfg: StartConfig, features: StartFeature[]): SetupStep {
  return {
    id: 'add',
    key: true,
    title: 'Add Supabase to your project',
    desc: "Here's exactly what lands in your repo for this setup. Create the new files and add your keys to the existing one.",
    blocks: [{ type: 'filetree', tree: buildFileTree(cfg, features) }],
  }
}

function keysStep(
  cfg: StartConfig,
  fw: FrameworkMeta,
  newNext: boolean,
  remote: boolean
): SetupStep {
  const envBlock: StepBlock = {
    type: 'code',
    lang: fw.envFile,
    code: lines([
      `${fw.envPrefix}SUPABASE_URL=https://<ref>.supabase.co`,
      `${fw.envPrefix}SUPABASE_ANON_KEY=<your-anon-key>`,
    ]),
  }
  if (remote) {
    const blocks: StepBlock[] = [
      {
        type: 'note',
        text: 'Dashboard → New project → Settings → API — or just ask your agent, the plugin can create the project and read the keys for you.',
      },
      envBlock,
      {
        type: 'code',
        lang: 'terminal',
        code: 'npx supabase link --project-ref <your-project-ref>   # so db push targets it',
      },
    ]
    return {
      id: 'keys',
      title: 'Create a project & add your keys',
      desc:
        (newNext ? 'Rename .env.example to .env.local, then ' : '') +
        `create a hosted project and copy its Project URL and anon key into ${fw.envFile}.`,
      blocks,
    }
  }
  return {
    id: 'keys',
    title: 'Add your local keys',
    desc: `Copy the API URL and anon key that supabase start printed into ${fw.envFile}.`,
    blocks: [envBlock],
  }
}

function installStep(fw: FrameworkMeta): SetupStep {
  return {
    id: 'install',
    title: 'Install the client library',
    desc:
      'Add the JavaScript client' +
      (fw.ssr ? ` and the SSR helpers for ${fw.label}.` : ` for ${fw.label}.`),
    blocks: [{ type: 'code', lang: 'terminal', code: `npm install ${fw.clientPkg}` }],
  }
}

function clientStep(fw: FrameworkMeta): SetupStep {
  return {
    id: 'client',
    title: 'Create the Supabase client',
    desc: 'A single helper you import wherever you talk to Supabase.',
    blocks: [clientBlock(fw)],
  }
}

function clientBlock(fw: FrameworkMeta): StepBlock {
  if (fw.id === 'nextjs') {
    return {
      type: 'code',
      lang: 'utils/supabase/client.ts',
      code: lines([
        "import { createBrowserClient } from '@supabase/ssr'",
        '',
        'export function createClient() {',
        '  return createBrowserClient(',
        '    process.env.NEXT_PUBLIC_SUPABASE_URL!,',
        '    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,',
        '  )',
        '}',
      ]),
    }
  }
  return {
    type: 'code',
    lang: 'src/lib/supabase.ts',
    code: lines([
      "import { createClient } from '@supabase/supabase-js'",
      '',
      'export const supabase = createClient(',
      '  import.meta.env.VITE_SUPABASE_URL,',
      '  import.meta.env.VITE_SUPABASE_ANON_KEY,',
      ')',
    ]),
  }
}

function ormInstallStep(cfg: StartConfig): SetupStep {
  const orm = ORMS[cfg.orm]
  const blocks: StepBlock[] = []
  if (cfg.orm === 'drizzle') {
    blocks.push({
      type: 'code',
      lang: 'terminal',
      code: 'npm install drizzle-orm postgres\nnpm install -D drizzle-kit',
    })
    blocks.push({
      type: 'code',
      lang: 'drizzle.config.ts',
      code: lines([
        "import { defineConfig } from 'drizzle-kit'",
        '',
        'export default defineConfig({',
        "  schema: './src/db/schema.ts',",
        "  dialect: 'postgresql',",
        '  dbCredentials: { url: process.env.DATABASE_URL! },',
        '})',
      ]),
    })
  } else {
    blocks.push({
      type: 'code',
      lang: 'terminal',
      code: 'npm install prisma @prisma/client\nnpx prisma init',
    })
    blocks.push({
      type: 'note',
      text: 'Set DATABASE_URL to your Supabase connection string (Dashboard → Settings → Database → Connection string).',
    })
  }
  return {
    id: 'orm',
    title: `Add ${orm.label}`,
    desc: `Use ${orm.label} as your typed data layer on top of Postgres.`,
    blocks,
  }
}

function primStep(
  p: PrimitiveId,
  cfg: StartConfig,
  fw: FrameworkMeta,
  newNext: boolean
): SetupStep {
  switch (p) {
    case 'database':
      return databaseStep(cfg)
    case 'auth':
      if (newNext) {
        return {
          id: 'auth',
          title: 'Customise authentication',
          desc: 'Email sign-in already works out of the box. Tweak it or add providers.',
          blocks: [
            {
              type: 'note',
              text: 'Dashboard → Authentication → Providers to add Google, GitHub, etc. The login UI lives in app/login.',
            },
          ],
        }
      }
      if (cfg.shadcn) {
        return {
          id: 'auth',
          title: 'Add authentication',
          desc: 'Drop in the password-based auth block — sign-in, sign-up and reset, wired to your client.',
          blocks: [
            {
              type: 'code',
              lang: 'terminal',
              code: `npx shadcn@latest add @supabase/${SHADCN_BLOCKS.auth}-${fw.shadcnTag}`,
            },
            {
              type: 'note',
              text: 'Generates the login form and route handlers. Restyle them like any shadcn component.',
            },
          ],
        }
      }
      return {
        id: 'auth',
        title: 'Add authentication',
        desc: 'Sign users in with email + password using the client.',
        blocks: [
          {
            type: 'code',
            lang: 'tsx',
            code: lines([
              'const { data, error } = await supabase.auth.signInWithPassword({',
              '  email, password,',
              '})',
            ]),
          },
        ],
      }
    case 'storage':
      if (cfg.shadcn) {
        return {
          id: 'storage',
          title: 'Set up file storage',
          desc: 'Use the Dropzone block for uploads, backed by a Storage bucket.',
          blocks: [
            {
              type: 'code',
              lang: 'terminal',
              code: `npx shadcn@latest add @supabase/${SHADCN_BLOCKS.storage}-${fw.shadcnTag}`,
            },
            {
              type: 'note',
              text: 'Create an avatars bucket in Studio (or via migration), then point the Dropzone at it.',
            },
          ],
        }
      }
      return {
        id: 'storage',
        title: 'Set up file storage',
        desc: 'Create a bucket in a migration, then upload from the client.',
        blocks: [
          {
            type: 'code',
            lang: 'sql',
            code: "insert into storage.buckets (id, name) values ('avatars', 'avatars');",
          },
          {
            type: 'code',
            lang: 'tsx',
            code: "await supabase.storage.from('avatars').upload(path, file)",
          },
        ],
      }
    case 'functions':
      return {
        id: 'functions',
        title: 'Add an Edge Function',
        desc:
          "Deno functions run close to your users. They're managed from the CLI" +
          (cfg.connection === 'remote' ? ' or by your agent.' : '.'),
        blocks: [
          {
            type: 'code',
            lang: 'terminal',
            code: lines([
              'npx supabase functions new hello',
              'npx supabase functions deploy hello',
            ]),
          },
          {
            type: 'code',
            lang: 'supabase/functions/hello/index.ts',
            code: lines([
              'Deno.serve(async (req) => {',
              '  const { name } = await req.json()',
              '  return new Response(`Hello ${name}!`)',
              '})',
            ]),
          },
        ],
      }
    case 'dataapi': {
      const blocks: StepBlock[] = [
        {
          type: 'code',
          lang: 'tsx',
          code: lines([
            'const { data, error } = await supabase',
            "  .from('todos')",
            "  .select('id, task, is_complete')",
            "  .order('inserted_at', { ascending: false })",
          ]),
        },
      ]
      if (cfg.orm !== 'none') {
        blocks.push({
          type: 'note',
          text: `Prefer typed queries? Run the same read through ${ORMS[cfg.orm].label} — the Data API and your ORM share the one Postgres database.`,
        })
      }
      return {
        id: 'dataapi',
        title: 'Query over the Data API',
        desc: 'Every table is instantly available over an auto-generated, secured REST endpoint — no API code to write.',
        blocks,
      }
    }
    case 'realtime':
      if (cfg.shadcn) {
        return {
          id: 'realtime',
          title: 'Add realtime',
          desc: 'Drop in live presence with the Realtime Cursor block, or subscribe directly.',
          blocks: [
            {
              type: 'code',
              lang: 'terminal',
              code: `npx shadcn@latest add @supabase/${SHADCN_BLOCKS.realtime}-${fw.shadcnTag}`,
            },
          ],
        }
      }
      return {
        id: 'realtime',
        title: 'Subscribe to realtime changes',
        desc: 'Stream inserts, updates and deletes straight to the client.',
        blocks: [
          {
            type: 'code',
            lang: 'tsx',
            code: lines([
              'supabase',
              "  .channel('todos')",
              "  .on('postgres_changes',",
              "    { event: '*', schema: 'public', table: 'todos' },",
              '    (payload) => console.log(payload))',
              '  .subscribe()',
            ]),
          },
        ],
      }
  }
}

/** Database step: declarative schema, ORM-aware (always code-first). */
function databaseStep(cfg: StartConfig): SetupStep {
  if (cfg.orm === 'drizzle') {
    return {
      id: 'database',
      title: 'Declare your schema with Drizzle',
      desc: 'Your TypeScript schema is the source of truth — Drizzle generates the SQL migration from it.',
      blocks: [
        {
          type: 'code',
          lang: 'src/db/schema.ts',
          code: lines([
            "import { pgTable, bigserial, text, boolean, timestamp } from 'drizzle-orm/pg-core'",
            '',
            "export const todos = pgTable('todos', {",
            "  id: bigserial('id', { mode: 'number' }).primaryKey(),",
            "  task: text('task').notNull(),",
            "  isComplete: boolean('is_complete').default(false),",
            "  insertedAt: timestamp('inserted_at').defaultNow(),",
            '})',
          ]),
        },
        {
          type: 'code',
          lang: 'terminal',
          code: lines([
            'npx drizzle-kit generate   # SQL migration from your schema',
            'npx drizzle-kit migrate    # apply it',
          ]),
        },
      ],
    }
  }
  if (cfg.orm === 'prisma') {
    return {
      id: 'database',
      title: 'Declare your schema with Prisma',
      desc: 'Edit your Prisma schema, then let Prisma Migrate diff it and write the migration.',
      blocks: [
        {
          type: 'code',
          lang: 'prisma/schema.prisma',
          code: lines([
            'model Todo {',
            '  id          BigInt   @id @default(autoincrement())',
            '  task        String',
            '  isComplete  Boolean  @default(false) @map("is_complete")',
            '  insertedAt  DateTime @default(now()) @map("inserted_at")',
            '',
            '  @@map("todos")',
            '}',
          ]),
        },
        { type: 'code', lang: 'terminal', code: 'npx prisma migrate dev --name create_todos' },
      ],
    }
  }
  // supabase-js → Supabase declarative schemas
  const blocks: StepBlock[] = []
  if (cfg.project === 'existing') {
    blocks.push({
      type: 'note',
      text: 'Bootstrapping declarative schemas on an existing DB? Pull production first: npx supabase db dump > supabase/schemas/prod.sql',
    })
  }
  blocks.push(
    {
      type: 'code',
      lang: 'supabase/schemas/todos.sql',
      code: lines([
        'create table "todos" (',
        '  "id"          bigint generated always as identity primary key,',
        '  "task"        text not null,',
        '  "is_complete" boolean default false,',
        '  "inserted_at" timestamptz default now()',
        ');',
      ]),
    },
    {
      type: 'code',
      lang: 'terminal',
      code: lines([
        'npx supabase db diff -f create_todos   # generate the migration',
        'npx supabase migration up              # apply locally',
      ]),
    }
  )
  return {
    id: 'database',
    title: 'Declare your schema',
    desc: 'Describe the state you want in a schema file — Supabase diffs it and writes a versioned migration for you.',
    blocks,
  }
}

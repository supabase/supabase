/**
 * Builds the live setup guide steps from the current config.
 * Ported from the prototype's `manualSteps()` and its step builders.
 *
 * Template output steps are sourced from the same resolved composition that
 * powers the visualizer and export flow.
 */
import type { CompositionResource } from './composition/resources'
import { selectedPrimitives, type StartComposition } from './composition/start-composition'
import {
  AGENTS,
  FRAMEWORKS,
  listEnglish,
  ORMS,
  PRIMITIVES,
  SHADCN_BLOCKS,
  type FrameworkMeta,
  type PrimitiveId,
  type StartConfig,
} from './config'
import type { FileTreeNode } from './file-tree'
import { buildProjectCodePlan, formatProjectCodeFileGroups } from './project-code-plan'

export type StepBlock =
  | { type: 'code'; lang: string; code: string }
  | { type: 'note'; text: string }
  | { type: 'filetree'; tree: FileTreeNode }

export interface SetupStep {
  id: string
  /** Brand-highlighted step number (a "key" setup action). */
  key?: boolean
  title: string
  desc?: string
  blocks: StepBlock[]
}

const lines = (arr: string[]) => arr.join('\n')

export function buildSteps(cfg: StartConfig, composition: StartComposition): SetupStep[] {
  const fw = FRAMEWORKS[cfg.framework]
  const frontend = fw.id !== 'none'
  const prims = selectedPrimitives(cfg, composition)
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

  // D) keys / project / link
  steps.push(keysStep(cfg, fw, newNext, remote))

  // E) ORM packages
  if (cfg.orm !== 'none') steps.push(ormInstallStep(cfg))

  const supabaseCode = supabaseCodeStep(cfg, composition)
  if (supabaseCode) steps.push(supabaseCode)

  const appConnection = connectAppStep(cfg, fw, prims, newNext, composition)
  if (appConnection) steps.push(appConnection)

  if (
    prims.includes('functions') &&
    !composition.resources.some((resource) => resource.kind === 'edge-function')
  ) {
    steps.push(functionsStep(cfg, composition))
  }

  if (composition.mergeResult?.warnings.length || composition.resolution.missingDeps.length) {
    steps.push(compositionWarningsStep(composition))
  }

  return steps
}

function compositionWarningsStep(composition: StartComposition): SetupStep {
  const warnings = [
    ...composition.resolution.missingDeps.map(
      (dependencyId) => `Could not find required template "${dependencyId}".`
    ),
    ...(composition.mergeResult?.warnings ?? []),
  ]

  return {
    id: 'composition-warnings',
    title: 'Check composition warnings',
    desc: 'Resolve these before applying the generated files.',
    blocks: warnings.map((text) => ({ type: 'note', text })),
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

function appPrimitiveBlocks(
  cfg: StartConfig,
  newNext: boolean,
  composition: StartComposition
): StepBlock[] {
  const blocks: StepBlock[] = []
  const prims = selectedPrimitives(cfg, composition)

  for (const p of prims) {
    switch (p) {
      case 'database':
      case 'functions':
        break
      case 'auth':
        if (newNext) {
          blocks.push({
            type: 'note',
            text: 'Email sign-in already works in the with-supabase starter. Tweak providers in Dashboard -> Authentication -> Providers; the login UI lives in app/login.',
          })
          break
        }
        if (cfg.shadcn) {
          blocks.push({
            type: 'note',
            text: 'Use the password-based auth block for sign-in, sign-up and reset flows. Restyle it like any shadcn component.',
          })
          break
        }
        blocks.push({
          type: 'code',
          lang: 'tsx',
          code: lines([
            'const { data, error } = await supabase.auth.signInWithPassword({',
            '  email, password,',
            '})',
          ]),
        })
        break
      case 'storage':
        if (cfg.shadcn) {
          blocks.push({
            type: 'note',
            text: 'Use the Dropzone block for uploads, backed by the Storage bucket added in your Supabase code.',
          })
          break
        }
        blocks.push({
          type: 'code',
          lang: 'tsx',
          code: "await supabase.storage.from('avatars').upload(path, file)",
        })
        break
      case 'dataapi': {
        const table = exampleTable(composition)
        blocks.push({
          type: 'code',
          lang: 'tsx',
          code: lines([
            'const { data, error } = await supabase',
            `  .from('${table.name}')`,
            "  .select('*')",
          ]),
        })
        if (cfg.orm !== 'none') {
          blocks.push({
            type: 'note',
            text: `Prefer typed queries? Run the same read through ${ORMS[cfg.orm].label} - the Data API and your ORM share the one Postgres database.`,
          })
        }
        break
      }
      case 'realtime':
        if (cfg.shadcn) {
          blocks.push({
            type: 'note',
            text: 'Use the Realtime Cursor block for live presence, or subscribe directly with the client.',
          })
          break
        }
        const table = exampleTable(composition)

        blocks.push({
          type: 'code',
          lang: 'tsx',
          code: lines([
            'supabase',
            `  .channel('${table.name}')`,
            "  .on('postgres_changes',",
            `    { event: '*', schema: '${table.schema}', table: '${table.name}' },`,
            '    (payload) => console.log(payload))',
            '  .subscribe()',
          ]),
        })
        break
    }
  }

  return blocks
}

function connectAppStep(
  cfg: StartConfig,
  fw: FrameworkMeta,
  prims: PrimitiveId[],
  newNext: boolean,
  composition: StartComposition
): SetupStep | null {
  if (fw.id === 'none') return null

  const blocks: StepBlock[] = []

  if (!newNext) {
    blocks.push({
      type: 'code',
      lang: 'terminal',
      code: `npm install ${fw.clientPkg}`,
    })
    blocks.push(clientBlock(fw))
  }

  const blockPrims = prims.filter((p) => SHADCN_BLOCKS[p])

  if (cfg.shadcn) {
    blocks.push({
      type: 'code',
      lang: 'terminal',
      code: lines([
        "npx shadcn@latest init -d   # if shadcn isn't set up yet",
        ...blockPrims.map(
          (p) => `npx shadcn@latest add @supabase/${SHADCN_BLOCKS[p]}-${fw.shadcnTag}`
        ),
      ]),
    })

    const missing = prims.filter((p) => !SHADCN_BLOCKS[p] && !['database', 'functions'].includes(p))
    if (missing.length) {
      blocks.push({
        type: 'note',
        text:
          missing.map((p) => PRIMITIVES[p].label).join(', ') +
          (missing.length > 1
            ? ' do not have prebuilt UI blocks, so connect them with the client snippets below.'
            : ' does not have a prebuilt UI block, so connect it with the client snippets below.'),
      })
    }
  }

  blocks.push(...appPrimitiveBlocks(cfg, newNext, composition))

  if (blocks.length === 0) return null

  return {
    id: 'connect-app',
    key: true,
    title: 'Connect to your app',
    desc: `Wire the installed Supabase code into your ${fw.label} app.`,
    blocks,
  }
}

function functionsStep(cfg: StartConfig, composition: StartComposition): SetupStep {
  const edgeFunctions = composition.resources
    .filter((resource) => resource.kind === 'edge-function')
    .sort((a, b) => a.label.localeCompare(b.label))

  if (edgeFunctions.length === 0) {
    return {
      id: 'functions',
      title: 'Enable Edge Functions runtime',
      desc: "Deno functions run close to your users. This setup enables the runtime, but doesn't add placeholder business logic.",
      blocks: [
        {
          type: 'note',
          text:
            'No Edge Function template is selected yet. Add a feature template, or create a named function only when you have real product logic for it' +
            (cfg.connection === 'remote' ? ' — your agent can do that through the plugin.' : '.'),
        },
      ],
    }
  }

  const functionNames = edgeFunctions.map((resource) => resource.label)

  return {
    id: 'functions',
    title: 'Deploy selected Edge Functions',
    desc: `Your selected templates include ${listEnglish(functionNames)}.`,
    blocks: [
      {
        type: 'code',
        lang: 'terminal',
        code: lines(functionNames.map((name) => `npx supabase functions deploy ${name}`)),
      },
    ],
  }
}

function supabaseCodeStep(cfg: StartConfig, composition: StartComposition): SetupStep | null {
  const plan = buildProjectCodePlan(cfg, composition)

  if (!plan.hasProjectCode) return null

  const blocks: StepBlock[] = []

  blocks.push({
    type: 'code',
    lang: 'text',
    code: formatProjectCodeFileGroups(plan.fileGroups),
  })

  if (plan.dependencyTemplates.length > 0) {
    blocks.push({
      type: 'note',
      text: `The registry pulls required dependencies automatically: ${listEnglish(
        plan.dependencyTemplates.map((template) => template.name)
      )}.`,
    })
  }

  if (plan.addCommands.length > 0) {
    blocks.push({
      type: 'code',
      lang: 'terminal',
      code: lines(plan.addCommands.map(({ command, name }) => `${command}   # ${name}`)),
    })
  }

  if (cfg.project === 'existing') {
    blocks.push({
      type: 'note',
      text: 'Bootstrapping declarative schemas on an existing DB? Pull production first: npx supabase db dump > supabase/schemas/prod.sql',
    })
  }

  if (plan.configFiles.length > 0) {
    blocks.push({
      type: 'note',
      text: 'After editing supabase/config.toml locally, restart Supabase: npx supabase stop && npx supabase start',
    })
  }

  if (plan.ormConversionNote) {
    blocks.push({
      type: 'note',
      text: plan.ormConversionNote,
    })
  }

  if (plan.migrationCommands.length > 0) {
    blocks.push({
      type: 'code',
      lang: 'terminal',
      code: lines(plan.migrationCommands),
    })
  }

  if (plan.deployCommands.length > 0) {
    blocks.push({
      type: 'code',
      lang: 'terminal',
      code: lines(plan.deployCommands),
    })
  }

  return {
    id: 'supabase-code',
    key: true,
    title: 'Add your Supabase code',
    desc: 'Install the selected Supabase templates from the shadcn registry, then apply the generated schema and function changes.',
    blocks,
  }
}

function exampleTable(composition: StartComposition): { schema: string; name: string } {
  const tables = composition.resources.filter(isTableResource).sort((a, b) => {
    if (a.schema === 'public' && b.schema !== 'public') return -1
    if (a.schema !== 'public' && b.schema === 'public') return 1
    return a.label.localeCompare(b.label)
  })

  const table = tables[0]
  return { schema: table?.schema ?? 'public', name: table?.label ?? 'todos' }
}

function isTableResource(resource: CompositionResource): resource is CompositionResource & {
  kind: 'table'
  schema: string
} {
  return resource.kind === 'table' && Boolean(resource.schema)
}

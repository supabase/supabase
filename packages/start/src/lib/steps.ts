/**
 * Builds the live setup guide steps from the current config.
 * Ported from the prototype's `manualSteps()` and its step builders.
 *
 * Template output steps are sourced from the same resolved composition that
 * powers the visualizer and export flow.
 */
import type { StartComposition } from './composition/start-composition'
import { AGENTS, listEnglish, ORMS, type FrameworkMeta, type StartConfig } from './config'
import {
  buildAppPrimitiveBlocks,
  buildAppTemplateBlocks,
  buildProjectCodeGuidanceBlocks,
  buildSupabaseTemplateBlocks,
  createGuideContext,
  getMissingShadcnPrimitiveLabels,
  getShadcnBlockName,
  getShadcnBlockPrimitives,
  type GuideBlock,
  type GuideContext,
} from './guide-content'
import { buildProjectCodePlan, formatProjectCodeFileGroups } from './project-code-plan'

export type StepBlock = GuideBlock

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
  const ctx = createGuideContext(cfg, composition)
  const { fw, frontend, newProj, newNext, remote, prims } = ctx
  const steps: SetupStep[] = []

  // A) create app (new project with a front-end framework)
  if (newProj && frontend) steps.push(bootstrapStep(fw, newNext))

  // B) install the agent plugin (always — bundles MCP + skills)
  steps.push(pluginStep(cfg))

  // C) install the CLI (always — code-first migrations run through it)
  steps.push(cliStep(cfg))

  // D) keys / project / link. Local keys are printed after the local stack
  // starts, which happens after template files and an initial migration exist.
  if (remote) steps.push(keysStep(cfg, fw, newNext, remote))

  // E) ORM packages
  if (cfg.orm !== 'none') steps.push(ormInstallStep(cfg))

  const supabaseCode = supabaseCodeStep(ctx)
  if (supabaseCode) steps.push(supabaseCode)

  if (!remote) steps.push(keysStep(cfg, fw, newNext, remote))

  const appConnection = connectAppStep(ctx)
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
  const code = lines(['npm install supabase --save-dev', 'npx supabase init'])
  const blocks: StepBlock[] = [{ type: 'code', lang: 'terminal', code }]
  blocks.push({
    type: 'note',
    text: local
      ? 'Install templates and generate the first migration before starting the local stack. That keeps seed.sql from running before its tables exist.'
      : "You'll run supabase db diff / db push here to version your schema against your hosted project.",
  })
  if (local) {
    blocks.push({
      type: 'note',
      text: 'If supabase start fails with a Postgres version mismatch, your Docker volume may be from an older major version. Run npx supabase stop --no-backup, remove the old volume, or set db.major_version in config.toml to match existing data.',
    })
  }
  return {
    id: 'cli',
    key: true,
    title: 'Install the Supabase CLI',
    desc: local
      ? 'Run the full stack — Postgres, Auth, Storage and Studio — locally in Docker.'
      : 'Code-first migrations are generated and pushed through the CLI.',
    blocks,
  }
}

function appEnvBlock(fw: FrameworkMeta, newNext: boolean, remote: boolean): StepBlock {
  const urlPlaceholder = remote ? 'https://<ref>.supabase.co' : 'http://127.0.0.1:54321'
  const keyName = fw.id === 'nextjs' && newNext ? 'SUPABASE_PUBLISHABLE_KEY' : 'SUPABASE_ANON_KEY'
  const keyPlaceholder = remote ? '<your-anon-key>' : '<local-anon-key>'

  return {
    type: 'code',
    lang: fw.envFile,
    code: lines([
      `${fw.envPrefix}SUPABASE_URL=${urlPlaceholder}`,
      `${fw.envPrefix}${keyName}=${keyPlaceholder}`,
    ]),
  }
}

function keysStep(
  cfg: StartConfig,
  fw: FrameworkMeta,
  newNext: boolean,
  remote: boolean
): SetupStep {
  const envBlock = appEnvBlock(fw, newNext, remote)
  const keyLabel = fw.id === 'nextjs' && newNext ? 'publishable key' : 'anon key'

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
        `create a hosted project and copy its Project URL and ${keyLabel} into ${fw.envFile}.`,
      blocks,
    }
  }
  return {
    id: 'keys',
    title: 'Add your local keys',
    desc: `Run supabase status after the local stack starts, then copy the API URL and ${keyLabel} into ${fw.envFile}.`,
    blocks: [
      {
        type: 'code',
        lang: 'terminal',
        code: 'npx supabase status -o env   # copy-paste ready env vars',
      },
      envBlock,
      {
        type: 'note',
        text: 'Use the exact ports from supabase status for API, Studio and Mailpit. Local projects can be remapped when another Supabase stack is already using the defaults.',
      },
    ],
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

function connectAppStep(ctx: GuideContext): SetupStep | null {
  const { cfg, fw, newNext } = ctx
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

  const blockPrims = getShadcnBlockPrimitives(ctx)

  if (cfg.shadcn) {
    const shadcnOverwrite = cfg.project === 'existing' ? ' -y --overwrite' : ''
    blocks.push({
      type: 'code',
      lang: 'terminal',
      code: lines([
        'test -f components.json || npx shadcn@latest init -d   # skip init when shadcn/ui is already configured',
        ...blockPrims.map(
          (p) =>
            `npx shadcn@latest add @supabase/${getShadcnBlockName(p)}-${fw.shadcnTag}${shadcnOverwrite}`
        ),
      ]),
    })
    blocks.push({
      type: 'note',
      text:
        'Do not run shadcn init when components.json already exists; the Next.js with-supabase starter and many existing apps already include it.' +
        (cfg.project === 'existing'
          ? ' Pass -y --overwrite when shadcn prompts to replace files that already exist.'
          : ''),
    })

    const missing = getMissingShadcnPrimitiveLabels(ctx)
    if (missing.length) {
      blocks.push({
        type: 'note',
        text:
          missing.join(', ') +
          (missing.length > 1
            ? ' do not have prebuilt UI blocks, so connect them with the client snippets below.'
            : ' does not have a prebuilt UI block, so connect it with the client snippets below.'),
      })
    }
  }

  blocks.push(...buildAppPrimitiveBlocks(ctx))
  blocks.push(...buildAppTemplateBlocks(ctx))

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

function supabaseCodeStep(ctx: GuideContext): SetupStep | null {
  const { cfg, composition } = ctx
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
      type: 'note',
      text: "Follow the instructions in each installed template's readme, especially when merging changes into supabase/config.toml.",
    })

    if (cfg.project === 'existing') {
      blocks.push({
        type: 'note',
        text: 'Template install commands include -y --overwrite so shadcn does not hang on overwrite prompts in an existing project.',
      })
    }

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
      text:
        cfg.connection === 'local'
          ? 'After editing supabase/config.toml locally, restart Supabase: npx supabase stop && npx supabase start. If ports collide, remap the full local stack in config.toml and re-check them with npx supabase status.'
          : 'Review supabase/config.toml before linking or pushing so the generated local settings match the hosted project you intend to deploy to.',
    })
  }

  blocks.push(...buildProjectCodeGuidanceBlocks(ctx))
  blocks.push(...buildSupabaseTemplateBlocks(ctx))

  if (cfg.connection === 'local' && plan.edgeFunctionFiles.length > 0) {
    blocks.push({
      type: 'note',
      text: 'supabase start serves Edge Functions locally — no separate functions serve step is needed unless you want hot reload. For secrets, use supabase/functions/.env and restart the stack after changes.',
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
  } else if (cfg.connection === 'local') {
    blocks.push({
      type: 'code',
      lang: 'terminal',
      code: 'npx supabase start',
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

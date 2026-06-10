import {
  selectedPrimitives,
  selectedTemplateNames,
  type StartComposition,
} from './composition/start-composition'
import { AGENTS, FRAMEWORKS, hasFrontend, ORMS, PRIMITIVES, type StartConfig } from './config'
import { buildSteps } from './steps'

function schemaRule(cfg: StartConfig): string {
  if (cfg.orm === 'drizzle')
    return 'edit src/db/schema.ts then `drizzle-kit generate` + `drizzle-kit migrate`'
  if (cfg.orm === 'prisma') return 'edit prisma/schema.prisma then `prisma migrate dev`'
  return 'declare tables in supabase/schemas/*.sql then `supabase db diff -f <name>`'
}

/** Static documentation links keyed to the current selection. */
function docLinks(cfg: StartConfig, composition: StartComposition): string[] {
  const fw = FRAMEWORKS[cfg.framework]
  const seen = new Set<string>()
  const links: string[] = []
  const add = (label: string | undefined, url: string | undefined) => {
    if (label && url && !seen.has(url)) {
      seen.add(url)
      links.push(`${label} — ${url}`)
    }
  }

  const frameworkLabel: Record<string, string> = {
    nextjs: 'Next.js quickstart',
    vite: 'React + Vite quickstart',
    tanstack: 'Getting started tutorials',
  }
  const frameworkUrl: Record<string, string> = {
    nextjs: 'https://supabase.com/docs/guides/getting-started/quickstarts/nextjs',
    vite: 'https://supabase.com/docs/guides/getting-started/quickstarts/reactjs',
    tanstack: 'https://supabase.com/docs/guides/getting-started/tutorials',
  }
  add(frameworkLabel[fw.id], frameworkUrl[fw.id])
  add(
    `${AGENTS[cfg.agent].label} + Supabase MCP`,
    'https://supabase.com/docs/guides/getting-started/mcp'
  )
  add('Supabase CLI', 'https://supabase.com/docs/guides/local-development/cli/getting-started')
  if (cfg.connection === 'local') {
    add('Local development', 'https://supabase.com/docs/guides/local-development/overview')
  }
  if (cfg.shadcn) {
    add('Supabase UI Library', 'https://supabase.com/ui/docs/getting-started/introduction')
  }
  if (cfg.orm === 'none') {
    add(
      'Declarative database schemas',
      'https://supabase.com/docs/guides/local-development/declarative-database-schemas'
    )
  }
  if (cfg.orm === 'drizzle') {
    add('Drizzle with Supabase', 'https://orm.drizzle.team/docs/get-started/supabase-new')
  }
  if (cfg.orm === 'prisma') {
    add('Prisma with Supabase', 'https://supabase.com/docs/guides/database/prisma')
  }

  const primDocs: Record<string, [string, string]> = {
    database: ['Database', 'https://supabase.com/docs/guides/database/overview'],
    auth: ['Auth', 'https://supabase.com/docs/guides/auth'],
    storage: ['Storage', 'https://supabase.com/docs/guides/storage'],
    functions: ['Edge Functions', 'https://supabase.com/docs/guides/functions'],
    dataapi: ['Data API (auto REST)', 'https://supabase.com/docs/guides/api'],
    realtime: ['Realtime', 'https://supabase.com/docs/guides/realtime'],
  }
  for (const p of selectedPrimitives(cfg, composition)) {
    if (primDocs[p]) add(primDocs[p][0], primDocs[p][1])
  }
  add('Row Level Security', 'https://supabase.com/docs/guides/database/postgres/row-level-security')

  return links
}

function codeBlock(lang: string, code: string): string[] {
  return ['```' + lang, code, '```']
}

function setupStepBlockLines(block: ReturnType<typeof buildSteps>[number]['blocks'][number]) {
  if (block.type === 'note') return [`> Note: ${block.text}`]
  if (block.type === 'filetree') return []

  const lang = block.lang === 'terminal' ? 'bash' : block.lang
  return codeBlock(lang, block.code)
}

export function buildAgentPlan(cfg: StartConfig, composition: StartComposition): string {
  const fw = FRAMEWORKS[cfg.framework]
  const frontend = hasFrontend(cfg)
  const prims = selectedPrimitives(cfg, composition).map((p) => PRIMITIVES[p].label)
  const remote = cfg.connection === 'remote'
  const newProj = cfg.project === 'new'
  const orm = ORMS[cfg.orm]
  const agent = AGENTS[cfg.agent]
  const templateNames = selectedTemplateNames(composition)

  const out: string[] = []
  out.push(frontend ? `# Set up Supabase in my ${fw.label} app` : '# Set up my Supabase backend')
  out.push('')
  out.push('## Stack')
  out.push(
    `- Project: ${newProj ? 'brand new — scaffold it from scratch' : 'existing app — add Supabase into it'}`
  )
  out.push(`- Framework: ${frontend ? `${fw.label} (${fw.meta})` : 'no front-end — backend only'}`)
  if (frontend) {
    out.push(
      `- UI: ${cfg.shadcn ? 'shadcn/ui + Supabase UI Library blocks' : 'my existing components'}`
    )
  }
  out.push(`- Services: ${prims.length ? prims.join(', ') : '(none selected yet)'}`)
  out.push(
    `- Data layer: ${cfg.orm === 'none' ? 'supabase-js over the Data API' : `${orm.label} on top of Postgres`}`
  )
  if (templateNames.length) out.push(`- Templates: ${templateNames.join(', ')}`)
  out.push('- Workflow: code-first — declarative schema + migrations in the repo')
  out.push(`- Tooling: ${agent.label} plugin (MCP + skills), Supabase CLI`)
  out.push(`- Environment: ${remote ? 'hosted Supabase project' : 'local Supabase stack (Docker)'}`)
  out.push('')

  out.push('## Build steps')
  out.push(
    "Implement these in order. Create or edit only what is needed, inspect files installed by shadcn before changing them, and adapt to my existing conventions. Don't overwrite files I already have."
  )
  out.push('')

  const steps = buildSteps(cfg, composition)

  steps.forEach((s, i) => {
    out.push(`### ${i + 1}. ${s.title}`)
    if (s.desc) out.push(s.desc)
    s.blocks.forEach((b) => {
      out.push('')
      setupStepBlockLines(b).forEach((l) => out.push(l))
    })
    out.push('')
  })

  out.push('## Rules')
  out.push(`- Keep all secrets in ${fw.envFile}; never hardcode keys.`)
  out.push(
    "- When the plugin asks, I'll give you an access token — use it but never print it back or commit it."
  )
  out.push(
    `- Manage schema declaratively: ${schemaRule(cfg)} — never hand-write ad-hoc migrations.`
  )
  out.push('- Enable row level security on every table and add sensible policies.')
  if (!newProj) {
    out.push(
      "- This is an existing codebase: match my conventions and don't clobber files I already have."
    )
  }
  out.push("- Show me a short summary of what you changed when you're done.")
  out.push('')
  out.push('## Reference docs')
  out.push("Consult these for anything you're unsure about:")
  docLinks(cfg, composition).forEach((d) => out.push(`- ${d}`))
  return out.join('\n')
}

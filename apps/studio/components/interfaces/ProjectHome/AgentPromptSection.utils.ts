// Install commands match the docs homepage prompt (apps/docs/components/HomePageCover.constants.ts).
// Database commands follow the CLI workflow guide (apps/docs/content/guides/local-development/cli-workflows.mdx).
export const AGENT_SETUP_COMMANDS = {
  installCli: 'npm install supabase --save-dev',
  installPlugin: 'npx plugins add supabase-community/supabase-plugin --yes',
  installSkills: 'npx skills add supabase/agent-skills',
  initialize: 'npx supabase init',
  login: 'npx supabase login',
  link: (projectRef: string) => `npx supabase link --project-ref ${projectRef}`,
  start: 'npx supabase start',
  status: 'npx supabase status',
  pull: 'npx supabase db pull --remote',
  generateSchema: 'npx supabase db schema declarative generate',
  syncSchema: 'npx supabase db schema declarative sync -f <name> --apply',
  newMigration: 'npx supabase migration new <name>',
  pushDryRun: 'npx supabase db push --dry-run --remote',
  push: 'npx supabase db push --yes --remote',
  configDiff: 'npx supabase config diff',
  configPush: 'npx supabase config push --yes',
  deployFunctions: 'npx supabase functions deploy --yes',
} as const

export type AgentPromptConnectionStrings = {
  direct?: string
  sessionPooler?: string
  transactionPooler?: string
  dedicatedPooler?: string
}

export type AgentPromptContext = {
  projectName?: string
  projectRef?: string
  apiUrl?: string
  publishableKey?: string | null
  jwksUrl?: string
  mcpUrl?: string
  connectionStrings?: AgentPromptConnectionStrings
  /** The IPv4 add-on makes direct and dedicated pooler connections reachable over IPv4 */
  hasIpv4Addon?: boolean
  /** Dashboard page where the person can copy their secret key */
  secretKeyUrl?: string
  /** Dashboard page where the person can reset their database password */
  databasePasswordUrl?: string
  isPlatform: boolean
}

const code = (value: string) => `\`${value}\``

// Env files often hold secrets, so the agent adds to them without reading them.
const ENV_STEP = [
  "Add the environment variables to my app's local env file, for example .env.local, using the names my framework expects, and make sure git ignores it.",
  "Never open, read or print my env files, because they may hold secrets. Add to them in a way that doesn't show you what's already there.",
  'Add the public values yourself. For a secret, add the variable with an empty value and ask me to fill it in myself, using the links above.',
  'Tell me which variables you added, and never hard-code these values or put a secret key in client-side code.',
].join(' ')

const isPresent = (line: string | null): line is string => line !== null

function buildProjectDetails({
  projectRef,
  apiUrl,
  publishableKey,
  jwksUrl,
  mcpUrl,
  isPlatform,
}: AgentPromptContext): string[] {
  const lines = [
    isPlatform && projectRef ? `- Project ref: ${code(projectRef)}` : null,
    apiUrl ? `- SUPABASE_URL: ${code(apiUrl)}` : null,
    publishableKey
      ? `- SUPABASE_PUBLISHABLE_KEY: ${code(publishableKey)} (safe to use in client-side code)`
      : null,
    jwksUrl ? `- SUPABASE_JWKS_URL: ${code(jwksUrl)} (for verifying user JWTs on a server)` : null,
    mcpUrl ? `- MCP server: ${code(mcpUrl)}` : null,
  ].filter(isPresent)

  if (lines.length === 0) return []
  return [
    'Project details (none of these are secrets). Use the variable names my framework expects, for example a NEXT_PUBLIC_ prefix in Next.js:',
    ...lines,
  ]
}

const ipNote = (hasIpv4Addon: boolean) =>
  hasIpv4Addon
    ? 'Works over IPv4 with my IPv4 add-on.'
    : 'IPv6 only, unless I enable the IPv4 add-on.'

/**
 * Lists each distinct connection string once. Projects without a pooler (local
 * CLI, high availability) resolve every option to the same direct string.
 */
export function buildConnectionStringLines({
  connectionStrings = {},
  hasIpv4Addon = false,
}: Pick<AgentPromptContext, 'connectionStrings' | 'hasIpv4Addon'>): string[] {
  const options = [
    {
      label: 'Direct connection',
      uri: connectionStrings.direct,
      note: `Best for long-running servers and migrations. ${ipNote(hasIpv4Addon)}`,
    },
    {
      label: 'Session pooler',
      uri: connectionStrings.sessionPooler,
      note: 'Use instead of a direct connection on IPv4 networks.',
    },
    {
      label: 'Transaction pooler',
      uri: connectionStrings.transactionPooler,
      note: "Best for serverless and edge functions with many short-lived connections. Doesn't support prepared statements.",
    },
    {
      label: 'Dedicated pooler',
      uri: connectionStrings.dedicatedPooler,
      note: `A PgBouncer pooler next to my database, for lower latency in transaction mode. ${ipNote(hasIpv4Addon)}`,
    },
  ]

  const seen = new Set<string>()
  return options.flatMap(({ label, uri, note }) => {
    if (!uri || seen.has(uri)) return []
    seen.add(uri)
    return [`- ${label}: ${code(uri)} ${note}`]
  })
}

function buildConnectionStringsSection(context: AgentPromptContext): string[] {
  const lines = buildConnectionStringLines(context)
  if (lines.length === 0) return []
  return [
    'Postgres connection strings, for ORMs and tools that connect to the database directly. Replace [YOUR-DATABASE-PASSWORD] with the real password from an environment variable:',
    ...lines,
  ]
}

function buildSecretsSection({
  secretKeyUrl,
  databasePasswordUrl,
  isPlatform,
}: AgentPromptContext): string[] {
  const where = [
    secretKeyUrl
      ? `- SUPABASE_SECRET_KEY (server-side only, bypasses Row Level Security): ${secretKeyUrl}`
      : null,
    databasePasswordUrl
      ? `- Database password: I set it when I created the project. If I've lost it, I can reset it at ${databasePasswordUrl}`
      : null,
  ].filter(isPresent)

  return [
    "Secrets aren't included here. If you need one, send me the link below and ask me to paste it into my environment file myself. Never ask me to paste a secret into chat.",
    ...(where.length > 0
      ? where
      : isPlatform
        ? []
        : ['- The secret key and database password are in my self-hosted configuration.']),
  ]
}

function buildSetupSection({ projectRef, isPlatform }: AgentPromptContext): string[] {
  const isLinkable = isPlatform && !!projectRef
  const restart =
    'If you need a restart to load the MCP server, tell me exactly what to do and what to say afterward to pick up where we left off.'

  const steps = [
    "If you can't run terminal commands, tell me how to add the MCP server above as a connector in this app, then build through it and skip the rest of these steps.",
    [
      "Find out what suits me. Look at my workspace first, then ask in one message only what it doesn't already tell you:",
      "   - How hands-on do I want to be? If I'd rather not deal with code, handle the files yourself and explain things in plain terms. If I'm a developer, show me the commands, files and diffs as you go.",
      "   - Should changes run on my computer first, or go straight to my project? Recommend running locally first if I'm comfortable with code and have Docker, and going straight to my project otherwise.",
      "   - Where should the project live? If this folder isn't an app project (for example my home folder, an empty folder or unrelated files), ask whether to use an existing project folder or create a new one, and where. If there's no app yet, ask what I want to build and offer to create a starter app there.",
    ].join('\n'),
    isPlatform
      ? `Run ${code(AGENT_SETUP_COMMANDS.installCli)}, and ${code(AGENT_SETUP_COMMANDS.initialize)} if there's no supabase/ folder. Then run ${code(AGENT_SETUP_COMMANDS.installPlugin)} for the Supabase MCP server and agent skills. ${restart} Warn me that the first MCP call opens a Supabase sign-in in my browser.`
      : `Run ${code(AGENT_SETUP_COMMANDS.installCli)}, and ${code(AGENT_SETUP_COMMANDS.initialize)} if there's no supabase/ folder. Then run ${code(AGENT_SETUP_COMMANDS.installSkills)} for the Supabase agent skills, and add the MCP server above to your MCP settings. ${restart}`,
    isLinkable
      ? `Ask me to run ${code(AGENT_SETUP_COMMANDS.login)} in my own terminal, since its browser sign-in can't finish in your shell. Then run ${code(AGENT_SETUP_COMMANDS.link(projectRef))}. If a command needs my database password, follow the secrets note above and tell me which command to run myself.`
      : null,
    [
      'Set up the option I chose:',
      `   - Locally first: run ${code(AGENT_SETUP_COMMANDS.start)} (it needs Docker, so tell me how to install it if it's missing) and use the local URL and publishable key from ${code(AGENT_SETUP_COMMANDS.status)} for my app.`,
      '   - Straight to my project: use the project values above for my app.',
    ].join('\n'),
    ENV_STEP,
  ].filter(isPresent)

  return ['## Set up', ...steps.map((step, index) => `${index + 1}. ${step}`)]
}

function buildChangesSection({ projectRef, isPlatform }: AgentPromptContext): string[] {
  const isLinkable = isPlatform && !!projectRef

  const goLive = isLinkable
    ? [
        '- Going live: tell me in plain terms what will change and wait for my OK before anything reaches my project.',
        `   - Database: preview with ${code(AGENT_SETUP_COMMANDS.pushDryRun)}, then run ${code(AGENT_SETUP_COMMANDS.push)}.`,
        `   - Settings: preview with ${code(AGENT_SETUP_COMMANDS.configDiff)}, then run ${code(AGENT_SETUP_COMMANDS.configPush)}.`,
        `   - Edge Functions: run ${code(AGENT_SETUP_COMMANDS.deployFunctions)}.`,
      ].join('\n')
    : '- Going live: tell me in plain terms what will change, then ask me how I apply migrations and settings to my self-hosted project.'

  return [
    '## Make changes',
    'Keep every change in my codebase so it stays versioned and repeatable, and explain each one at the level I asked for.',
    [
      '- Database, locally first: keep the schema as declarative SQL files in supabase/schemas.',
      isLinkable
        ? ` If my project already has tables, pull them with ${code(AGENT_SETUP_COMMANDS.pull)}, then create the schema files with ${code(AGENT_SETUP_COMMANDS.generateSchema)}.`
        : '',
      ` For each change, edit the schema files and run ${code(AGENT_SETUP_COMMANDS.syncSchema)} to generate a migration and apply it locally. Don't change the local database directly, because the schema files won't pick it up.`,
    ].join(''),
    `- Database, straight to my project: write each change as a migration with ${code(AGENT_SETUP_COMMANDS.newMigration)}. If my project already has tables, check them with the MCP server first.`,
    '- Settings: change auth providers and redirect URLs, storage buckets, Edge Function options and other project settings in supabase/config.toml, not in the dashboard, so they stay with the code.',
    '- Edge Functions: keep them in supabase/functions.',
    goLive,
    '- Commit related files together, and use the MCP server to inspect my project, read logs and search the docs.',
  ]
}

/**
 * Builds the prompt a user pastes into their coding agent. The agent works
 * code-first for everyone, and first finds out how hands-on the person wants
 * to be and whether changes should run on a local stack or go straight to the
 * project, so it suits non-technical builders and developers alike. It only
 * stops for steps that need the person, and secrets stay out of the prompt.
 */
export function buildAgentPrompt(context: AgentPromptContext): string {
  const projectLabel = context.projectName ? ` "${context.projectName}"` : ''
  const details = buildProjectDetails(context)
  const connectionStrings = buildConnectionStringsSection(context)

  const sections = [
    [
      `Help me connect my Supabase project${projectLabel} so you can build with it.`,
      ...(details.length > 0 ? ['', ...details] : []),
      ...(connectionStrings.length > 0 ? ['', ...connectionStrings] : []),
      '',
      ...buildSecretsSection(context),
      '',
      'Keep setup quick: do everything you can yourself and only stop when a step needs me.',
    ],
    buildSetupSection(context),
    buildChangesSection(context),
    [
      '## Finish',
      "Confirm everything works by listing my project's tables. Then summarize what you set up in a few lines and, unless I already told you, ask me what I want to build.",
    ],
  ]

  return sections.map((lines) => lines.join('\n')).join('\n\n')
}

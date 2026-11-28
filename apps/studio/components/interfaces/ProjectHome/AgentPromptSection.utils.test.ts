import { describe, expect, test } from 'vitest'

import { buildAgentPrompt, buildConnectionStringLines } from './AgentPromptSection.utils'

const DIRECT =
  'postgresql://postgres:[YOUR-DATABASE-PASSWORD]@db.abcdefghijklmnop.supabase.co:5432/postgres'
const SESSION =
  'postgresql://postgres.abcdefghijklmnop:[YOUR-DATABASE-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres'
const TRANSACTION =
  'postgresql://postgres.abcdefghijklmnop:[YOUR-DATABASE-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres'
const DEDICATED =
  'postgresql://postgres:[YOUR-DATABASE-PASSWORD]@db.abcdefghijklmnop.supabase.co:6543/postgres'

const PLATFORM_CONTEXT = {
  projectName: 'Acme',
  projectRef: 'abcdefghijklmnop',
  apiUrl: 'https://abcdefghijklmnop.supabase.co',
  publishableKey: 'sb_publishable_123',
  jwksUrl: 'https://abcdefghijklmnop.supabase.co/auth/v1/.well-known/jwks.json',
  mcpUrl: 'https://mcp.supabase.com/mcp?project_ref=abcdefghijklmnop',
  connectionStrings: {
    direct: DIRECT,
    sessionPooler: SESSION,
    transactionPooler: TRANSACTION,
    dedicatedPooler: DEDICATED,
  },
  hasIpv4Addon: false,
  secretKeyUrl: 'https://supabase.com/dashboard/project/abcdefghijklmnop/settings/api-keys',
  databasePasswordUrl: 'https://supabase.com/dashboard/project/abcdefghijklmnop/database/settings',
  isPlatform: true,
}

const SELF_HOSTED_CONTEXT = {
  projectName: 'Default Project',
  projectRef: 'default',
  apiUrl: 'http://localhost:8000',
  mcpUrl: 'http://localhost:8000/mcp',
  isPlatform: false,
}

describe('buildAgentPrompt', () => {
  test('gives the agent the same public values as the Connect sheet, under their env var names', () => {
    const prompt = buildAgentPrompt(PLATFORM_CONTEXT)

    expect(prompt).toContain('my Supabase project "Acme"')
    expect(prompt).toContain('Project ref: `abcdefghijklmnop`')
    expect(prompt).toContain('SUPABASE_URL: `https://abcdefghijklmnop.supabase.co`')
    expect(prompt).toContain('SUPABASE_PUBLISHABLE_KEY: `sb_publishable_123`')
    expect(prompt).toContain(
      'SUPABASE_JWKS_URL: `https://abcdefghijklmnop.supabase.co/auth/v1/.well-known/jwks.json`'
    )
    expect(prompt).toContain(
      'MCP server: `https://mcp.supabase.com/mcp?project_ref=abcdefghijklmnop`'
    )
  })

  test('lists every connection option so the agent can pick one for how the app runs', () => {
    const prompt = buildAgentPrompt(PLATFORM_CONTEXT)

    expect(prompt).toContain(`Direct connection: \`${DIRECT}\``)
    expect(prompt).toContain(`Session pooler: \`${SESSION}\``)
    expect(prompt).toContain(`Transaction pooler: \`${TRANSACTION}\``)
    expect(prompt).toContain(`Dedicated pooler: \`${DEDICATED}\``)
  })

  test('keeps secrets out and links to where the person can get them instead', () => {
    const prompt = buildAgentPrompt(PLATFORM_CONTEXT)

    expect(prompt).toContain('[YOUR-DATABASE-PASSWORD]')
    expect(prompt).toContain(
      'SUPABASE_SECRET_KEY (server-side only, bypasses Row Level Security): https://supabase.com/dashboard/project/abcdefghijklmnop/settings/api-keys'
    )
    expect(prompt).toContain(
      'reset it at https://supabase.com/dashboard/project/abcdefghijklmnop/database/settings'
    )
    expect(prompt).toContain('Never ask me to paste a secret into chat')
    expect(prompt).not.toMatch(/sb_secret_|service_role/)
  })

  test('finds out how hands-on the person wants to be, so it suits builders and developers alike', () => {
    const prompt = buildAgentPrompt(PLATFORM_CONTEXT)

    expect(prompt).toContain('Find out what suits me')
    expect(prompt).toContain('ask in one message')
    expect(prompt).toContain('How hands-on do I want to be?')
    expect(prompt).toContain('explain things in plain terms')
    expect(prompt).toContain('show me the commands, files and diffs')
    expect(prompt).not.toContain('I may never open it')
  })

  test('works code-first, with one choice between running locally first or going straight to the project', () => {
    const prompt = buildAgentPrompt(PLATFORM_CONTEXT)

    expect(prompt).toContain(
      'Should changes run on my computer first, or go straight to my project?'
    )
    expect(prompt).toContain('Keep every change in my codebase')
    expect(prompt).toContain('explain each one at the level I asked for')
  })

  test('uses declarative schemas locally and plain migrations when there is no local stack', () => {
    const prompt = buildAgentPrompt(PLATFORM_CONTEXT)

    expect(prompt).toContain('`npx supabase start`')
    expect(prompt).toContain('`npx supabase db schema declarative sync -f <name> --apply`')
    expect(prompt).toContain('`npx supabase db pull --remote`')
    expect(prompt).toContain('`npx supabase db schema declarative generate`')
    expect(prompt).toContain('`npx supabase migration new <name>`')
  })

  test('keeps project settings in config.toml, which the MCP server has no equivalent for', () => {
    const prompt = buildAgentPrompt(PLATFORM_CONTEXT)

    expect(prompt).toContain('in supabase/config.toml, not in the dashboard')
    expect(prompt).toContain('`npx supabase config diff`')
    expect(prompt).toContain('`npx supabase config push --yes`')
    expect(prompt).toContain('`npx supabase functions deploy --yes`')
  })

  test('previews every change and waits for the person before anything reaches the project', () => {
    const prompt = buildAgentPrompt(PLATFORM_CONTEXT)

    expect(prompt).toContain('wait for my OK before anything reaches my project')
    expect(prompt).toContain('`npx supabase db push --dry-run --remote`')
    expect(prompt).toContain('`npx supabase db push --yes --remote`')
  })

  test('connects the MCP server, and falls back to it for agents without a terminal', () => {
    const prompt = buildAgentPrompt(PLATFORM_CONTEXT)

    expect(prompt).toContain('`npx plugins add supabase-community/supabase-plugin --yes`')
    expect(prompt).toContain('add the MCP server above as a connector')
  })

  test("hands browser sign-in and passwords to the person instead of the agent's shell or chat", () => {
    const prompt = buildAgentPrompt(PLATFORM_CONTEXT)

    expect(prompt).toContain('Ask me to run `npx supabase login` in my own terminal')
    expect(prompt).toContain('follow the secrets note above')
  })

  test('skips the steps that need a hosted project on self-hosted', () => {
    const prompt = buildAgentPrompt(SELF_HOSTED_CONTEXT)

    expect(prompt).not.toContain('supabase link')
    expect(prompt).not.toContain('supabase login')
    expect(prompt).not.toContain('--remote')
    expect(prompt).not.toContain('Project ref:')
    expect(prompt).toContain('`npx skills add supabase/agent-skills`')
    expect(prompt).toContain('ask me how I apply migrations and settings to my self-hosted project')
    expect(prompt).not.toContain('config push')
  })

  test('checks the agent is in the right folder before setting anything up', () => {
    const prompt = buildAgentPrompt(PLATFORM_CONTEXT)

    expect(prompt).toContain('Where should the project live?')
    expect(prompt).toContain('use an existing project folder or create a new one, and where')
  })

  test('adds env variables without reading the env file, which may already hold secrets', () => {
    const prompt = buildAgentPrompt(PLATFORM_CONTEXT)

    expect(prompt).toContain('Never open, read or print my env files')
    expect(prompt).toContain("in a way that doesn't show you what's already there")
    expect(prompt).toContain('make sure git ignores it')
    expect(prompt).toContain('add the variable with an empty value and ask me to fill it in myself')
  })

  test('still produces a usable prompt while project details are loading', () => {
    const prompt = buildAgentPrompt({ isPlatform: true })

    expect(prompt).not.toContain('undefined')
    expect(prompt).not.toContain('``')
    expect(prompt).not.toContain('Project details:')
  })
})

describe('buildConnectionStringLines', () => {
  test('lists a string once when projects without a pooler resolve every option to it', () => {
    const lines = buildConnectionStringLines({
      connectionStrings: {
        direct: DIRECT,
        sessionPooler: DIRECT,
        transactionPooler: DIRECT,
      },
    })

    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('Direct connection')
  })

  test('tells the agent which connections need IPv6 unless the IPv4 add-on is on', () => {
    const [withoutAddon] = buildConnectionStringLines({ connectionStrings: { direct: DIRECT } })
    const [withAddon] = buildConnectionStringLines({
      connectionStrings: { direct: DIRECT },
      hasIpv4Addon: true,
    })

    expect(withoutAddon).toContain('IPv6 only')
    expect(withAddon).toContain('Works over IPv4')
  })
})

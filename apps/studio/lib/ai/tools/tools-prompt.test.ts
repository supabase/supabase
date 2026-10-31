import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { buildAssistantContextMessages, NO_SCHEMA_ACCESS_MESSAGE } from '../assistant-context'
import { buildSystemPrompt } from '../generate-assistant-response.utils'
import { getTools } from './index'
import { LEGACY_TOOL_CONTRACTS } from './legacy-tools'
import { getMcpTools } from './mcp-tools'
import { REMOTE_TOOL_CONTRACTS, TOOL_CONTRACTS } from './registry'
import { buildToolsPrompt } from './tools-prompt'
import type { RemoteToolContract, ToolEnvironment } from './types'

const state = vi.hoisted(() => ({ isPlatform: true }))

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  const mocked = { ...actual }
  Object.defineProperty(mocked, 'IS_PLATFORM', { get: () => state.isPlatform, enumerable: true })
  return mocked
})

vi.mock('./mcp-tools', () => ({ getMcpTools: vi.fn() }))

// Removed tools that saved chats still mention. No prompt may name them.
const LEGACY_TOOL_NAMES: string[] = Object.keys(LEGACY_TOOL_CONTRACTS)
// A local contract wins over a remote one of the same name, as in `buildToolsPrompt`.
const CONTRACTS: RemoteToolContract[] = [
  ...new Map<string, RemoteToolContract>(
    [...Object.values(REMOTE_TOOL_CONTRACTS), ...Object.values(TOOL_CONTRACTS)].map((contract) => [
      contract.name,
      contract,
    ])
  ).values(),
]
const ALL_TOOL_NAMES = [...CONTRACTS.map(({ name }) => name), ...LEGACY_TOOL_NAMES]

const ENVIRONMENTS: ToolEnvironment[] = ['platform', 'self-hosted']
const BOOLEANS = [false, true]

type Variant = {
  label: string
  environment: ToolEnvironment
  isExplorerEnabled: boolean
  supportMode: boolean
  hasBaseUrl: boolean
}

const VARIANTS: Variant[] = ENVIRONMENTS.flatMap((environment) =>
  BOOLEANS.flatMap((isExplorerEnabled) =>
    BOOLEANS.flatMap((supportMode) =>
      BOOLEANS.map((hasBaseUrl) => ({
        label: `${environment}, explorer ${isExplorerEnabled}, support ${supportMode}, baseUrl ${hasBaseUrl}`,
        environment,
        isExplorerEnabled,
        supportMode,
        hasBaseUrl,
      }))
    )
  )
)

/** The names of the tools production gives the model for a variant, from the real `getTools`. */
async function toolNamesFor({
  environment,
  isExplorerEnabled,
  supportMode,
  hasBaseUrl,
}: Variant): Promise<Set<string>> {
  state.isPlatform = environment === 'platform'
  const tools = await getTools({
    projectRef: 'abcdefghijklmnopqrst',
    connectionString: 'postgresql://localhost',
    authorization: 'Bearer token',
    aiOptInLevel: 'schema_and_log_and_data',
    accessToken: 'access-token',
    baseUrl: hasBaseUrl ? 'https://supabase.com/dashboard' : undefined,
    isExplorerEnabled,
    supportMode,
    signal: new AbortController().signal,
  })
  return new Set(Object.keys(tools))
}

const PLATFORM_ALL: Variant = VARIANTS.find(
  (variant) =>
    variant.environment === 'platform' &&
    variant.isExplorerEnabled &&
    variant.supportMode &&
    variant.hasBaseUrl
)!

beforeEach(() => {
  vi.mocked(getMcpTools).mockResolvedValue(
    Object.fromEntries(
      Object.keys(REMOTE_TOOL_CONTRACTS).map((name) => [
        name,
        { description: 'x', inputSchema: z.object({}), execute: async () => ({}) },
      ])
    ) as never
  )
})

function namedTools(text: string): string[] {
  return ALL_TOOL_NAMES.filter((name) =>
    new RegExp(`(?<![A-Za-z0-9_])${name}(?![A-Za-z0-9_])`).test(text)
  )
}

// The only tool the system prompt may name outside its generated tools section. SECURITY_PROMPT
// is shared with the code completion endpoint, so it can't move into `execute_sql`'s guidance;
// `execute_sql` is available in every variant.
const BASE_PROMPT_TOOL_EXCEPTIONS = ['execute_sql']

describe('buildToolsPrompt', () => {
  describe.each(VARIANTS)('$label', (variant) => {
    const { supportMode } = variant

    it('names only available tools in the system prompt', async () => {
      const available = await toolNamesFor(variant)
      const unavailable = namedTools(buildSystemPrompt(available)).filter(
        (name) => !available.has(name)
      )
      expect(unavailable).toEqual([])
    })

    it('names only available tools in the context messages', async () => {
      const available = await toolNamesFor(variant)
      const messages = buildAssistantContextMessages({
        projectRef: 'abcdefghijklmnopqrst',
        chatName: 'Chat',
        schemasString: NO_SCHEMA_ACCESS_MESSAGE,
        supportMode,
        aiOptInLevel: 'schema',
      })
      const unavailable = namedTools(messages.map(({ content }) => content).join('\n')).filter(
        (name) => !available.has(name)
      )
      expect(unavailable).toEqual([])
    })

    it('names only available tools in the logs snippet message', async () => {
      const available = await toolNamesFor(variant)
      const messages = buildAssistantContextMessages({
        schemasString: NO_SCHEMA_ACCESS_MESSAGE,
        includesLogsSnippets: true,
      })
      const unavailable = namedTools(messages[0].content).filter((name) => !available.has(name))
      expect(unavailable).toEqual([])
    })

    it('lists every contract tool it is given once, sorted', async () => {
      const available = await toolNamesFor(variant)
      const [, listLine] = buildToolsPrompt(available).split('\n')
      const expected = CONTRACTS.filter((contract) => available.has(contract.name))
        .map(({ name }) => name)
        .sort()
      expect(listLine).toBe(
        `Tools available in this chat: ${expected.map((name) => `\`${name}\``).join(', ')}.`
      )
    })

    it('gives a section to exactly the given tools that have guidance', async () => {
      const available = await toolNamesFor(variant)
      const sections = [...buildToolsPrompt(available).matchAll(/^### `(.+)`$/gm)].map(
        ([, name]) => name
      )
      const expected = CONTRACTS.filter(
        (contract) => available.has(contract.name) && contract.promptGuidance
      )
        .map(({ name }) => name)
        .sort()
      expect(sections).toEqual(expected)
    })
  })

  it('lists only the tools it is given, ignoring tools without a contract', () => {
    const prompt = buildToolsPrompt(['execute_sql', 'load_knowledge', 'getSchemaTables'])
    expect(prompt).toContain('### `execute_sql`')
    expect(prompt).toContain('### `load_knowledge`')
    expect(prompt.split('\n')[1]).toBe(
      'Tools available in this chat: `execute_sql`, `load_knowledge`.'
    )
  })

  it('lists each tool once when given duplicates', () => {
    const prompt = buildToolsPrompt(['execute_sql', 'execute_sql'])
    expect(prompt.split('\n')[1]).toBe('Tools available in this chat: `execute_sql`.')
  })

  it('omits remote tools that failed to load', () => {
    const prompt = buildToolsPrompt(['execute_sql', 'list_policies'])
    expect(prompt).not.toContain('search_docs')
    expect(prompt).not.toContain('list_tables')
  })

  it('lists a tool without guidance only in the list line', () => {
    const prompt = buildToolsPrompt(['execute_sql', 'list_policies'])
    expect(TOOL_CONTRACTS.list_policies).not.toHaveProperty('promptGuidance')
    expect(prompt.split('\n')[1]).toContain('`list_policies`')
    expect(prompt).not.toContain('### `list_policies`')
  })

  it('puts a tool with guidance in a section holding that guidance', () => {
    const prompt = buildToolsPrompt(['search_docs'])
    expect(prompt).toContain(
      `### \`search_docs\`\n${REMOTE_TOOL_CONTRACTS.search_docs.promptGuidance}`
    )
  })

  it('does not repeat tool descriptions', async () => {
    const prompt = buildToolsPrompt(await toolNamesFor(PLATFORM_ALL))
    for (const contract of Object.values(TOOL_CONTRACTS)) {
      expect(prompt).not.toContain(contract.description)
    }
  })
})

describe('chat system prompt', () => {
  it.each(VARIANTS)('names tools only in its generated section ($label)', async (variant) => {
    const toolNames = await toolNamesFor(variant)
    const system = buildSystemPrompt(toolNames)
    const toolsPrompt = buildToolsPrompt(toolNames)
    expect(system).toContain(toolsPrompt)
    expect(namedTools(system.replace(toolsPrompt, ''))).toEqual(BASE_PROMPT_TOOL_EXCEPTIONS)
  })

  it('match tool names as whole words', () => {
    expect(namedTools('Use list_tables_extra and xlist_tables.')).toEqual([])
    expect(namedTools('Use `list_tables`.')).toEqual(['list_tables'])
  })
})

describe('promptGuidance', () => {
  it.each(CONTRACTS.map((contract) => [contract.name, contract] as const))(
    '%s has non-empty, trimmed guidance when set',
    (_name, contract) => {
      if (contract.promptGuidance === undefined) return
      expect(contract.promptGuidance).not.toBe('')
      expect(contract.promptGuidance).toBe(contract.promptGuidance.trim())
    }
  )
})

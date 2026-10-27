import { describe, expect, it } from 'vitest'

import { buildAssistantContextMessages, NO_SCHEMA_ACCESS_MESSAGE } from '../assistant-context'
import { buildSystemPrompt } from '../generate-assistant-response.utils'
import { LEGACY_TOOL_CONTRACTS } from './legacy-tools'
import {
  getToolRequest,
  isToolAvailable,
  REMOTE_TOOL_CONTRACTS,
  TOOL_CONTRACTS,
  type ToolRequest,
} from './registry'
import { buildToolsPrompt } from './tools-prompt'
import type { RemoteToolContract, ToolEnvironment, ToolRequirement } from './types'

// The legacy names are the self-hosted fallback tools, which exist only there.
const FALLBACK_TOOL_NAMES: string[] = Object.keys(LEGACY_TOOL_CONTRACTS)
const CONTRACTS: RemoteToolContract[] = [
  ...Object.values(TOOL_CONTRACTS),
  ...Object.values(REMOTE_TOOL_CONTRACTS),
]
const ALL_TOOL_NAMES = [...CONTRACTS.map(({ name }) => name), ...FALLBACK_TOOL_NAMES]

const ENVIRONMENTS: ToolEnvironment[] = ['platform', 'self-hosted']
const BOOLEANS = [false, true]

type Variant = { label: string; request: ToolRequest; supportMode: boolean }

const VARIANTS: Variant[] = ENVIRONMENTS.flatMap((environment) =>
  BOOLEANS.flatMap((explorer) =>
    BOOLEANS.flatMap((supportMode) =>
      BOOLEANS.map((baseUrl) => {
        const satisfied = new Set<ToolRequirement>()
        if (explorer) satisfied.add('explorer')
        if (supportMode) satisfied.add('supportMode')
        if (baseUrl) satisfied.add('baseUrl')
        return {
          label: `${environment}, explorer ${explorer}, support ${supportMode}, baseUrl ${baseUrl}`,
          request: { environment, satisfied },
          supportMode,
        }
      })
    )
  )
)

function availableToolNames(request: ToolRequest): Set<string> {
  const names = CONTRACTS.filter((contract) => isToolAvailable(contract.availability, request)).map(
    ({ name }) => name
  )
  return new Set(request.environment === 'self-hosted' ? [...names, ...FALLBACK_TOOL_NAMES] : names)
}

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
  describe.each(VARIANTS)('$label', ({ request, supportMode }) => {
    const available = availableToolNames(request)

    it('names only available tools in the system prompt', () => {
      const unavailable = namedTools(buildSystemPrompt(request)).filter(
        (name) => !available.has(name)
      )
      expect(unavailable).toEqual([])
    })

    it('names only available tools in the context messages', () => {
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

    it('names only available tools in the logs snippet message', () => {
      const messages = buildAssistantContextMessages({
        schemasString: NO_SCHEMA_ACCESS_MESSAGE,
        includesLogsSnippets: true,
      })
      const [ownText] = messages[0].content.split('\n\n')
      const unavailable = namedTools(ownText).filter((name) => !available.has(name))
      expect(unavailable).toEqual([])
    })

    it('lists every available contract tool once, sorted', () => {
      const [, listLine] = buildToolsPrompt(request).split('\n')
      const expected = CONTRACTS.filter((contract) => available.has(contract.name))
        .map(({ name }) => name)
        .sort()
      expect(listLine).toBe(
        `Tools available in this chat: ${expected.map((name) => `\`${name}\``).join(', ')}.`
      )
    })

    it('gives a section to exactly the available tools that have guidance', () => {
      const sections = [...buildToolsPrompt(request).matchAll(/^### `(.+)`$/gm)].map(
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

  it('omits platform-only tools on self-hosted and keeps the shared ones', () => {
    const prompt = buildToolsPrompt({ environment: 'self-hosted', satisfied: new Set() })
    expect(prompt).toContain('### `execute_sql`')
    expect(prompt).toContain('### `load_knowledge`')
    expect(prompt).not.toContain('search_docs')
    expect(prompt).not.toContain('query_logs')
    expect(prompt).not.toContain('update_opt_in_level')
  })

  it('includes notebook guidance only when Explorer is on', () => {
    const withExplorer = buildToolsPrompt({
      environment: 'platform',
      satisfied: new Set(['explorer']),
    })
    const without = buildToolsPrompt({ environment: 'platform', satisfied: new Set() })
    expect(withExplorer).toContain('### `create_notebook`')
    expect(without).not.toContain('notebook')
  })

  it('lists a tool without guidance only in the list line', () => {
    const prompt = buildToolsPrompt({ environment: 'platform', satisfied: new Set() })
    expect(TOOL_CONTRACTS.list_policies).not.toHaveProperty('promptGuidance')
    expect(prompt.split('\n')[1]).toContain('`list_policies`')
    expect(prompt).not.toContain('### `list_policies`')
  })

  it('puts a tool with guidance in a section holding that guidance', () => {
    const prompt = buildToolsPrompt({ environment: 'platform', satisfied: new Set() })
    expect(prompt).toContain(
      `### \`search_docs\`\n${REMOTE_TOOL_CONTRACTS.search_docs.promptGuidance}`
    )
  })

  it('does not repeat tool descriptions', () => {
    const prompt = buildToolsPrompt({
      environment: 'platform',
      satisfied: new Set(['explorer', 'supportMode', 'baseUrl']),
    })
    for (const contract of Object.values(TOOL_CONTRACTS)) {
      expect(prompt).not.toContain(contract.description)
    }
  })
})

describe('chat system prompt', () => {
  it.each(VARIANTS)('names tools only in its generated section ($label)', ({ request }) => {
    const system = buildSystemPrompt(request)
    const toolsPrompt = buildToolsPrompt(request)
    expect(system).toContain(toolsPrompt)
    expect(namedTools(system.replace(toolsPrompt, ''))).toEqual(BASE_PROMPT_TOOL_EXCEPTIONS)
  })

  it('match tool names as whole words', () => {
    expect(namedTools('Use list_tables_extra and xlist_tables.')).toEqual([])
    expect(namedTools('Use `list_tables`.')).toEqual(['list_tables'])
  })
})

describe('getToolRequest', () => {
  it('marks each satisfied requirement', () => {
    const { satisfied } = getToolRequest({
      isExplorerEnabled: true,
      supportMode: true,
      baseUrl: 'https://example.com',
    })
    expect([...satisfied].sort()).toEqual(['baseUrl', 'explorer', 'supportMode'])
    expect(getToolRequest({}).satisfied.size).toBe(0)
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

import { describe, expect, test } from 'vitest'

import { resolveSteps } from '../connect.resolver'
import { connectSchema } from '../connect.schema'
import type { ConnectState } from '../Connect.types'

// ============================================================================
// Schema Integrity Tests
// ============================================================================

describe('connect.schema:structure', () => {
  test('should have all required modes', () => {
    const modeIds = connectSchema.modes.map((m) => m.id)
    expect(modeIds).toEqual(expect.arrayContaining(['framework', 'direct', 'orm', 'mcp']))
  })

  test('all mode fields should exist in fields definition', () => {
    connectSchema.modes.forEach((mode) => {
      mode.fields.forEach((fieldId) => {
        expect(
          connectSchema.fields[fieldId],
          `Field "${fieldId}" in mode "${mode.id}" should exist in fields definition`
        ).toBeDefined()
      })
    })
  })

  test('connectionMethod has no static default', () => {
    // defaultValue is intentionally unset — useConnectState.setMode picks the
    // per-deployment-mode default (platform/CLI: 'direct'; self-hosted: 'session')
    expect(connectSchema.fields.connectionMethod.defaultValue).toBeUndefined()
  })
})

// ============================================================================
// Steps Resolution Integration Tests
// ============================================================================

const stepIds = (state: ConnectState) => resolveSteps(connectSchema, state).map((s) => s.id)

describe('connect.schema:steps resolution', () => {
  test.each<[string, ConnectState, string[], string[]]>([
    [
      'nextjs without shadcn',
      { mode: 'framework', framework: 'nextjs', frameworkUi: false },
      ['install', 'install-skills'],
      ['shadcn-add'],
    ],
    [
      'nextjs with shadcn',
      { mode: 'framework', framework: 'nextjs', frameworkUi: true },
      ['shadcn-add', 'shadcn-env'],
      ['shadcn-explore'],
    ],
    [
      'react without shadcn',
      { mode: 'framework', framework: 'react', frameworkUi: false },
      ['install'],
      ['shadcn-add'],
    ],
    [
      'react with shadcn',
      { mode: 'framework', framework: 'react', frameworkUi: true },
      ['shadcn-add', 'shadcn-env'],
      [],
    ],
    ['other frameworks', { mode: 'framework', framework: 'remix' }, ['install', 'configure'], []],
    ['default direct mode', { mode: 'direct' }, ['connection'], []],
    [
      'direct nodejs',
      { mode: 'direct', connectionType: 'nodejs' },
      ['direct-install', 'direct-files'],
      [],
    ],
    [
      'direct golang',
      { mode: 'direct', connectionType: 'golang' },
      ['direct-install', 'direct-files'],
      [],
    ],
    ['direct python', { mode: 'direct', connectionType: 'python' }, ['direct-install'], []],
    ['direct dotnet', { mode: 'direct', connectionType: 'dotnet' }, ['direct-install'], []],
    ['orm prisma', { mode: 'orm', orm: 'prisma' }, ['install', 'configure', 'install-skills'], []],
    ['orm drizzle', { mode: 'orm', orm: 'drizzle' }, ['install', 'configure'], []],
    ['mcp cursor', { mode: 'mcp', mcpClient: 'cursor' }, ['configure-mcp', 'install-skills'], []],
    [
      'mcp codex',
      { mode: 'mcp', mcpClient: 'codex' },
      ['codex-add-server', 'codex-authenticate', 'codex-verify'],
      [],
    ],
    [
      'mcp claude-code',
      { mode: 'mcp', mcpClient: 'claude-code' },
      ['claude-add-server', 'claude-authenticate'],
      [],
    ],
    ['mcp unknown client', { mode: 'mcp', mcpClient: 'unknown-client' }, ['configure-mcp'], []],
  ])('resolves steps for %s', (_label, state, present, absent) => {
    const ids = stepIds(state)
    expect(ids).toEqual(expect.arrayContaining(present))
    absent.forEach((id) => expect(ids).not.toContain(id))
  })

  test.each<ConnectState['mode']>(['framework', 'direct', 'orm', 'mcp'])(
    'includes the skills install step in %s mode',
    (mode) => {
      expect(stepIds({ mode })).toContain('install-skills')
    }
  )

  test.each<[ConnectState, string]>([
    [{ mode: 'framework', framework: 'nextjs', frameworkVariant: 'app' }, 'Install packages'],
    [{ mode: 'framework', framework: 'nextjs', frameworkVariant: 'pages' }, 'Install package'],
    [{ mode: 'framework', framework: 'remix' }, 'Install packages'],
    [{ mode: 'framework', framework: 'vuejs' }, 'Install package'],
  ])('install step title for %o is "%s"', (state, title) => {
    const installStep = resolveSteps(connectSchema, state).find((s) => s.id === 'install')
    expect(installStep?.title).toBe(title)
  })
})

// ============================================================================
// Step Content Path Tests
// ============================================================================

describe('connect.schema:step content paths', () => {
  test.each<[ConnectState, string, string]>([
    [{ mode: 'framework', framework: 'nextjs' }, 'install', 'steps/install'],
    [
      { mode: 'framework', framework: 'nextjs', frameworkUi: true },
      'shadcn-add',
      'steps/shadcn/command',
    ],
    [
      { mode: 'framework', framework: 'nextjs', frameworkUi: true },
      'shadcn-env',
      'steps/shadcn/env',
    ],
    [{ mode: 'direct' }, 'connection', 'steps/direct-connection'],
    [{ mode: 'framework' }, 'install-skills', 'steps/skills-install'],
    // The ORM configure step uses a {{orm}} template resolved by the dynamic import system
    [{ mode: 'orm', orm: 'prisma' }, 'configure', '{{orm}}'],
    [{ mode: 'mcp', mcpClient: 'cursor' }, 'configure-mcp', 'steps/mcp/cursor'],
    [{ mode: 'mcp', mcpClient: 'codex' }, 'codex-add-server', 'steps/mcp/codex/add-server'],
    [{ mode: 'mcp', mcpClient: 'codex' }, 'codex-authenticate', 'steps/mcp/codex/authenticate'],
    [{ mode: 'mcp', mcpClient: 'codex' }, 'codex-verify', 'steps/mcp/codex/verify'],
    [
      { mode: 'mcp', mcpClient: 'claude-code' },
      'claude-add-server',
      'steps/mcp/claude-code/add-server',
    ],
    [
      { mode: 'mcp', mcpClient: 'claude-code' },
      'claude-authenticate',
      'steps/mcp/claude-code/authenticate',
    ],
  ])('%o: step "%s" uses content "%s"', (state, stepId, content) => {
    const step = resolveSteps(connectSchema, state).find((s) => s.id === stepId)
    expect(step?.content).toBe(content)
  })
})

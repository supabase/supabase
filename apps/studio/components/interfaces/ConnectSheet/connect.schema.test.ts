import { describe, test, expect } from 'vitest'
import { connectSchema, INSTALL_COMMANDS } from './connect.schema'
import { resolveSteps } from './connect.resolver'
import type { ConnectState } from './Connect.types'

// ============================================================================
// Schema Structure Tests
// ============================================================================

describe('connect.schema:structure', () => {
  test('should have all required modes', () => {
    const modeIds = connectSchema.modes.map((m) => m.id)
    expect(modeIds).toContain('framework')
    expect(modeIds).toContain('direct')
    expect(modeIds).toContain('orm')
    expect(modeIds).toContain('mcp')
  })

  test('each mode should have required properties', () => {
    connectSchema.modes.forEach((mode) => {
      expect(mode.id).toBeDefined()
      expect(mode.label).toBeDefined()
      expect(mode.description).toBeDefined()
      expect(mode.fields).toBeDefined()
      expect(Array.isArray(mode.fields)).toBe(true)
    })
  })

  test('framework mode should have correct fields', () => {
    const frameworkMode = connectSchema.modes.find((m) => m.id === 'framework')
    expect(frameworkMode?.fields).toContain('framework')
    expect(frameworkMode?.fields).toContain('frameworkVariant')
    expect(frameworkMode?.fields).toContain('library')
    expect(frameworkMode?.fields).toContain('frameworkUi')
  })

  test('direct mode should have correct fields', () => {
    const directMode = connectSchema.modes.find((m) => m.id === 'direct')
    expect(directMode?.fields).toContain('connectionMethod')
    expect(directMode?.fields).toContain('useSharedPooler')
    expect(directMode?.fields).toContain('connectionType')
  })

  test('orm mode should have correct fields', () => {
    const ormMode = connectSchema.modes.find((m) => m.id === 'orm')
    expect(ormMode?.fields).toContain('orm')
  })

  test('mcp mode should have correct fields', () => {
    const mcpMode = connectSchema.modes.find((m) => m.id === 'mcp')
    expect(mcpMode?.fields).toContain('mcpClient')
    expect(mcpMode?.fields).toContain('mcpReadonly')
    expect(mcpMode?.fields).toContain('mcpFeatures')
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
})

// ============================================================================
// Field Definition Tests
// ============================================================================

describe('connect.schema:fields', () => {
  test('framework field should have correct type', () => {
    const field = connectSchema.fields.framework
    expect(field.type).toBe('radio-grid')
    expect(field.options).toEqual({ source: 'frameworks' })
    expect(field.defaultValue).toBe('nextjs')
  })

  test('frameworkVariant field should depend on framework', () => {
    const field = connectSchema.fields.frameworkVariant
    expect(field.dependsOn).toEqual({ framework: ['nextjs', 'react'] })
  })

  test('frameworkUi field should be a switch type', () => {
    const field = connectSchema.fields.frameworkUi
    expect(field.type).toBe('switch')
    expect(field.defaultValue).toBe(false)
    expect(field.dependsOn).toEqual({ framework: ['nextjs', 'react'] })
  })

  test('connectionMethod field should have radio-list type', () => {
    const field = connectSchema.fields.connectionMethod
    expect(field.type).toBe('radio-list')
    expect(field.options).toEqual({ source: 'connectionMethods' })
    expect(field.defaultValue).toBe('direct')
  })

  test('useSharedPooler field should depend on transaction connection method', () => {
    const field = connectSchema.fields.useSharedPooler
    expect(field.type).toBe('switch')
    expect(field.dependsOn).toEqual({ connectionMethod: ['transaction'] })
  })

  test('orm field should have radio-list type', () => {
    const field = connectSchema.fields.orm
    expect(field.type).toBe('radio-list')
    expect(field.options).toEqual({ source: 'orms' })
    expect(field.defaultValue).toBe('prisma')
  })

  test('mcpClient field should have select type', () => {
    const field = connectSchema.fields.mcpClient
    expect(field.type).toBe('select')
    expect(field.options).toEqual({ source: 'mcpClients' })
    expect(field.defaultValue).toBe('cursor')
  })

  test('mcpFeatures field should have multi-select type', () => {
    const field = connectSchema.fields.mcpFeatures
    expect(field.type).toBe('multi-select')
    expect(field.options).toEqual({ source: 'mcpFeatures' })
  })
})

// ============================================================================
// Install Commands Tests
// ============================================================================

describe('connect.schema:INSTALL_COMMANDS', () => {
  test('should have install command for supabase-js', () => {
    expect(INSTALL_COMMANDS.supabasejs).toBe('npm install @supabase/supabase-js')
  })

  test('should have install command for supabase-py', () => {
    expect(INSTALL_COMMANDS.supabasepy).toBe('pip install supabase')
  })

  test('should have install command for supabase-flutter', () => {
    expect(INSTALL_COMMANDS.supabaseflutter).toBe('flutter pub add supabase_flutter')
  })

  test('should have install command for supabase-swift', () => {
    expect(INSTALL_COMMANDS.supabaseswift).toContain('swift package add-dependency')
  })

  test('should have install command for supabase-kt', () => {
    expect(INSTALL_COMMANDS.supabasekt).toContain('io.github.jan-tennert.supabase')
  })
})

// ============================================================================
// Steps Resolution Integration Tests
// ============================================================================

describe('connect.schema:steps resolution', () => {
  describe('framework mode steps', () => {
    test('should resolve steps for nextjs without shadcn', () => {
      const state: ConnectState = { mode: 'framework', framework: 'nextjs', frameworkUi: false }
      const steps = resolveSteps(connectSchema, state)

      expect(steps.length).toBeGreaterThan(0)
      expect(steps.find((s) => s.id === 'install')).toBeDefined()
      expect(steps.find((s) => s.id === 'install-skills')).toBeDefined()
    })

    test('should resolve shadcn steps for nextjs with frameworkUi true', () => {
      const state: ConnectState = { mode: 'framework', framework: 'nextjs', frameworkUi: true }
      const steps = resolveSteps(connectSchema, state)

      expect(steps.find((s) => s.id === 'shadcn-add')).toBeDefined()
      expect(steps.find((s) => s.id === 'shadcn-explore')).toBeDefined()
    })

    test('should resolve steps for react without shadcn', () => {
      const state: ConnectState = { mode: 'framework', framework: 'react', frameworkUi: false }
      const steps = resolveSteps(connectSchema, state)

      expect(steps.length).toBeGreaterThan(0)
      expect(steps.find((s) => s.id === 'install')).toBeDefined()
    })

    test('should resolve shadcn steps for react with frameworkUi true', () => {
      const state: ConnectState = { mode: 'framework', framework: 'react', frameworkUi: true }
      const steps = resolveSteps(connectSchema, state)

      expect(steps.find((s) => s.id === 'shadcn-add')).toBeDefined()
    })

    test('should resolve default steps for other frameworks', () => {
      const state: ConnectState = { mode: 'framework', framework: 'remix' }
      const steps = resolveSteps(connectSchema, state)

      expect(steps.length).toBeGreaterThan(0)
      expect(steps.find((s) => s.id === 'install')).toBeDefined()
      expect(steps.find((s) => s.id === 'configure')).toBeDefined()
    })
  })

  describe('direct mode steps', () => {
    test('should resolve connection step for default direct mode', () => {
      const state: ConnectState = { mode: 'direct' }
      const steps = resolveSteps(connectSchema, state)

      expect(steps.find((s) => s.id === 'connection')).toBeDefined()
    })

    test('should resolve install and files steps for nodejs connection type', () => {
      const state: ConnectState = { mode: 'direct', connectionType: 'nodejs' }
      const steps = resolveSteps(connectSchema, state)

      expect(steps.find((s) => s.id === 'direct-install')).toBeDefined()
      expect(steps.find((s) => s.id === 'direct-files')).toBeDefined()
    })

    test('should resolve install and files steps for golang connection type', () => {
      const state: ConnectState = { mode: 'direct', connectionType: 'golang' }
      const steps = resolveSteps(connectSchema, state)

      expect(steps.find((s) => s.id === 'direct-install')).toBeDefined()
      expect(steps.find((s) => s.id === 'direct-files')).toBeDefined()
    })

    test('should resolve install and files steps for python connection type', () => {
      const state: ConnectState = { mode: 'direct', connectionType: 'python' }
      const steps = resolveSteps(connectSchema, state)

      expect(steps.find((s) => s.id === 'direct-install')).toBeDefined()
    })

    test('should resolve install and files steps for dotnet connection type', () => {
      const state: ConnectState = { mode: 'direct', connectionType: 'dotnet' }
      const steps = resolveSteps(connectSchema, state)

      expect(steps.find((s) => s.id === 'direct-install')).toBeDefined()
    })
  })

  describe('orm mode steps', () => {
    test('should resolve install and configure steps for prisma', () => {
      const state: ConnectState = { mode: 'orm', orm: 'prisma' }
      const steps = resolveSteps(connectSchema, state)

      expect(steps.find((s) => s.id === 'install')).toBeDefined()
      expect(steps.find((s) => s.id === 'configure')).toBeDefined()
      expect(steps.find((s) => s.id === 'install-skills')).toBeDefined()
    })

    test('should resolve install and configure steps for drizzle', () => {
      const state: ConnectState = { mode: 'orm', orm: 'drizzle' }
      const steps = resolveSteps(connectSchema, state)

      expect(steps.find((s) => s.id === 'install')).toBeDefined()
      expect(steps.find((s) => s.id === 'configure')).toBeDefined()
    })
  })

  describe('mcp mode steps', () => {
    test('should resolve configure step for cursor client', () => {
      const state: ConnectState = { mode: 'mcp', mcpClient: 'cursor' }
      const steps = resolveSteps(connectSchema, state)

      expect(steps.find((s) => s.id === 'configure-mcp')).toBeDefined()
      expect(steps.find((s) => s.id === 'install-skills')).toBeDefined()
    })

    test('should resolve codex-specific steps for codex client', () => {
      const state: ConnectState = { mode: 'mcp', mcpClient: 'codex' }
      const steps = resolveSteps(connectSchema, state)

      expect(steps.find((s) => s.id === 'codex-add-server')).toBeDefined()
      expect(steps.find((s) => s.id === 'codex-enable-remote')).toBeDefined()
      expect(steps.find((s) => s.id === 'codex-authenticate')).toBeDefined()
      expect(steps.find((s) => s.id === 'codex-verify')).toBeDefined()
    })

    test('should resolve claude-code-specific steps for claude-code client', () => {
      const state: ConnectState = { mode: 'mcp', mcpClient: 'claude-code' }
      const steps = resolveSteps(connectSchema, state)

      expect(steps.find((s) => s.id === 'claude-add-server')).toBeDefined()
      expect(steps.find((s) => s.id === 'claude-authenticate')).toBeDefined()
    })

    test('should resolve default mcp steps for other clients', () => {
      const state: ConnectState = { mode: 'mcp', mcpClient: 'unknown-client' }
      const steps = resolveSteps(connectSchema, state)

      expect(steps.find((s) => s.id === 'configure-mcp')).toBeDefined()
    })
  })

  describe('skills install step', () => {
    test('should include skills install step in all modes', () => {
      const modes: ConnectState['mode'][] = ['framework', 'direct', 'orm', 'mcp']

      modes.forEach((mode) => {
        const state: ConnectState = { mode }
        const steps = resolveSteps(connectSchema, state)

        expect(
          steps.find((s) => s.id === 'install-skills'),
          `Mode "${mode}" should have skills install step`
        ).toBeDefined()
      })
    })
  })
})

// ============================================================================
// Step Content Path Tests
// ============================================================================

describe('connect.schema:step content paths', () => {
  test('install step should have valid content path', () => {
    const state: ConnectState = { mode: 'framework', framework: 'nextjs' }
    const steps = resolveSteps(connectSchema, state)
    const installStep = steps.find((s) => s.id === 'install')

    expect(installStep?.content).toBe('steps/install')
  })

  test('shadcn command step should have valid content path', () => {
    const state: ConnectState = { mode: 'framework', framework: 'nextjs', frameworkUi: true }
    const steps = resolveSteps(connectSchema, state)
    const shadcnStep = steps.find((s) => s.id === 'shadcn-add')

    expect(shadcnStep?.content).toBe('steps/shadcn/command')
  })

  test('shadcn explore step should have valid content path', () => {
    const state: ConnectState = { mode: 'framework', framework: 'nextjs', frameworkUi: true }
    const steps = resolveSteps(connectSchema, state)
    const exploreStep = steps.find((s) => s.id === 'shadcn-explore')

    expect(exploreStep?.content).toBe('steps/shadcn/explore')
  })

  test('direct connection step should have valid content path', () => {
    const state: ConnectState = { mode: 'direct' }
    const steps = resolveSteps(connectSchema, state)
    const connectionStep = steps.find((s) => s.id === 'connection')

    expect(connectionStep?.content).toBe('steps/direct-connection')
  })

  test('skills install step should have valid content path', () => {
    const state: ConnectState = { mode: 'framework' }
    const steps = resolveSteps(connectSchema, state)
    const skillsStep = steps.find((s) => s.id === 'install-skills')

    expect(skillsStep?.content).toBe('steps/skills-install')
  })

  test('orm configure step should use template content path', () => {
    // The ORM configure step uses a template {{orm}} that gets resolved
    // by the dynamic import system, not the resolver
    const state: ConnectState = { mode: 'orm', orm: 'prisma' }
    const steps = resolveSteps(connectSchema, state)
    const configureStep = steps.find((s) => s.id === 'configure')

    // The content path uses template syntax for the component loader
    expect(configureStep?.content).toBe('{{orm}}')
  })

  test('mcp cursor configure step should have valid content path', () => {
    const state: ConnectState = { mode: 'mcp', mcpClient: 'cursor' }
    const steps = resolveSteps(connectSchema, state)
    const configureStep = steps.find((s) => s.id === 'configure-mcp')

    expect(configureStep?.content).toBe('steps/mcp/cursor')
  })

  test('codex steps should have valid content paths', () => {
    const state: ConnectState = { mode: 'mcp', mcpClient: 'codex' }
    const steps = resolveSteps(connectSchema, state)

    expect(steps.find((s) => s.id === 'codex-add-server')?.content).toBe(
      'steps/mcp/codex/add-server'
    )
    expect(steps.find((s) => s.id === 'codex-enable-remote')?.content).toBe(
      'steps/mcp/codex/enable-remote'
    )
    expect(steps.find((s) => s.id === 'codex-authenticate')?.content).toBe(
      'steps/mcp/codex/authenticate'
    )
    expect(steps.find((s) => s.id === 'codex-verify')?.content).toBe('steps/mcp/codex/verify')
  })

  test('claude-code steps should have valid content paths', () => {
    const state: ConnectState = { mode: 'mcp', mcpClient: 'claude-code' }
    const steps = resolveSteps(connectSchema, state)

    expect(steps.find((s) => s.id === 'claude-add-server')?.content).toBe(
      'steps/mcp/claude-code/add-server'
    )
    expect(steps.find((s) => s.id === 'claude-authenticate')?.content).toBe(
      'steps/mcp/claude-code/authenticate'
    )
  })
})

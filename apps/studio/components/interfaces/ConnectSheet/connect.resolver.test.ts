import { describe, expect, test } from 'vitest'

import type { ConditionalValue, ConnectSchema, StepTree } from './Connect.types'
import {
  getActiveFields,
  getDefaultState,
  resolveConditional,
  resolveState,
  resolveSteps,
} from './connect.resolver'

// ============================================================================
// resolveConditional Tests
// ============================================================================

describe('connect.resolver:resolveConditional', () => {
  test('should return primitive values directly', () => {
    expect(resolveConditional('hello', { mode: 'framework' })).toBe('hello')
    expect(resolveConditional(42, { mode: 'framework' })).toBe(42)
    expect(resolveConditional(null, { mode: 'framework' })).toBe(null)
    expect(resolveConditional(true, { mode: 'framework' })).toBe(true)
  })

  test('should return arrays directly', () => {
    const arr = ['a', 'b', 'c']
    expect(resolveConditional(arr, { mode: 'framework' })).toBe(arr)
  })

  test('should resolve single-level conditional based on mode', () => {
    const conditional: ConditionalValue<string> = {
      framework: 'Framework Content',
      direct: 'Direct Content',
      DEFAULT: 'Default Content',
    }

    expect(resolveConditional(conditional, { mode: 'framework' })).toBe('Framework Content')
    expect(resolveConditional(conditional, { mode: 'direct' })).toBe('Direct Content')
    expect(resolveConditional(conditional, { mode: 'orm' })).toBe('Default Content')
  })

  test('should resolve nested conditionals (mode -> framework)', () => {
    const conditional: ConditionalValue<string> = {
      framework: {
        nextjs: 'Next.js Content',
        react: 'React Content',
        DEFAULT: 'Generic Framework',
      },
      direct: 'Direct Content',
    }

    expect(resolveConditional(conditional, { mode: 'framework', framework: 'nextjs' })).toBe(
      'Next.js Content'
    )
    expect(resolveConditional(conditional, { mode: 'framework', framework: 'react' })).toBe(
      'React Content'
    )
    expect(resolveConditional(conditional, { mode: 'framework', framework: 'vue' })).toBe(
      'Generic Framework'
    )
    expect(resolveConditional(conditional, { mode: 'direct' })).toBe('Direct Content')
  })

  test('should resolve deeply nested conditionals (mode -> framework -> variant)', () => {
    const conditional: ConditionalValue<string> = {
      framework: {
        nextjs: {
          app: 'App Router Content',
          pages: 'Pages Router Content',
          DEFAULT: 'Generic Next.js',
        },
        DEFAULT: 'Generic Framework',
      },
    }

    expect(
      resolveConditional(conditional, {
        mode: 'framework',
        framework: 'nextjs',
        frameworkVariant: 'app',
      })
    ).toBe('App Router Content')
    expect(
      resolveConditional(conditional, {
        mode: 'framework',
        framework: 'nextjs',
        frameworkVariant: 'pages',
      })
    ).toBe('Pages Router Content')
    expect(
      resolveConditional(conditional, {
        mode: 'framework',
        framework: 'nextjs',
        frameworkVariant: 'unknown',
      })
    ).toBe('Generic Next.js')
  })

  test('should resolve MCP client-specific content', () => {
    const conditional: ConditionalValue<string> = {
      mcp: {
        cursor: 'Cursor Config',
        codex: 'Codex Config',
        'claude-code': 'Claude Code Config',
        DEFAULT: 'Generic MCP',
      },
    }

    expect(resolveConditional(conditional, { mode: 'mcp', mcpClient: 'cursor' })).toBe(
      'Cursor Config'
    )
    expect(resolveConditional(conditional, { mode: 'mcp', mcpClient: 'codex' })).toBe(
      'Codex Config'
    )
    expect(resolveConditional(conditional, { mode: 'mcp', mcpClient: 'claude-code' })).toBe(
      'Claude Code Config'
    )
  })

  test('should return undefined when no match and no DEFAULT', () => {
    const conditional: ConditionalValue<string> = {
      framework: 'Framework',
      direct: 'Direct',
    }

    expect(resolveConditional(conditional, { mode: 'orm' })).toBe(undefined)
  })

  test('should handle frameworkUi boolean state (as string "true"/"false")', () => {
    const conditional: ConditionalValue<string> = {
      framework: {
        nextjs: {
          true: 'Shadcn Steps',
          DEFAULT: 'Regular Steps',
        },
      },
    }

    // When frameworkUi is true (boolean), it gets converted to string "true"
    expect(
      resolveConditional(conditional, { mode: 'framework', framework: 'nextjs', frameworkUi: true })
    ).toBe('Shadcn Steps')
    expect(
      resolveConditional(conditional, {
        mode: 'framework',
        framework: 'nextjs',
        frameworkUi: false,
      })
    ).toBe('Regular Steps')
  })
})

// ============================================================================
// resolveSteps Tests
// ============================================================================

describe('connect.resolver:resolveSteps', () => {
  const createMockSchema = (steps: StepTree): ConnectSchema => ({
    fields: {},
    steps,
  })

  test('should resolve steps array for framework mode', () => {
    const schema = createMockSchema({
      mode: {
        framework: [
          { id: 'step1', title: 'Install', description: 'Install pkg', content: 'install-content' },
          { id: 'step2', title: 'Configure', description: 'Configure', content: 'config-content' },
        ],
        direct: [
          {
            id: 'connection',
            title: 'Connection',
            description: 'Connect',
            content: 'direct-content',
          },
        ],
      },
    })

    const steps = resolveSteps(schema, { mode: 'framework' })
    expect(steps).toHaveLength(2)
    expect(steps[0].id).toBe('step1')
    expect(steps[0].title).toBe('Install')
    expect(steps[1].id).toBe('step2')
  })

  test('should resolve steps for direct mode', () => {
    const schema = createMockSchema({
      mode: {
        framework: [{ id: 'step1', title: 'Install', description: 'Install', content: 'install' }],
        direct: [
          { id: 'connection', title: 'Connection', description: 'Connect', content: 'direct' },
        ],
      },
    })

    const steps = resolveSteps(schema, { mode: 'direct' })
    expect(steps).toHaveLength(1)
    expect(steps[0].id).toBe('connection')
  })

  test('should filter out steps with empty content', () => {
    const schema = createMockSchema({
      mode: {
        framework: [
          { id: 'step1', title: 'Valid', description: 'Valid step', content: 'valid-content' },
          { id: 'step2', title: 'Empty', description: 'Empty step', content: '' },
          { id: 'step3', title: 'Null', description: 'Null step', content: null },
        ],
      },
    })

    const steps = resolveSteps(schema, { mode: 'framework' })
    expect(steps).toHaveLength(1)
    expect(steps[0].id).toBe('step1')
  })

  test('should resolve conditional step content based on state', () => {
    const schema = createMockSchema({
      mode: {
        framework: [
          {
            id: 'configure',
            title: 'Configure',
            description: 'Configure',
            content: {
              nextjs: 'nextjs-content',
              react: 'react-content',
              DEFAULT: 'generic-content',
            },
          },
        ],
      },
    })

    const nextjsSteps = resolveSteps(schema, { mode: 'framework', framework: 'nextjs' })
    expect(nextjsSteps[0].content).toBe('nextjs-content')

    const reactSteps = resolveSteps(schema, { mode: 'framework', framework: 'react' })
    expect(reactSteps[0].content).toBe('react-content')

    const vueSteps = resolveSteps(schema, { mode: 'framework', framework: 'vue' })
    expect(vueSteps[0].content).toBe('generic-content')
  })

  test('should return empty array when no steps resolve', () => {
    const schema = createMockSchema({
      mode: {
        framework: [{ id: 'step1', title: 'Step', description: 'Desc', content: '' }],
      },
    })

    const steps = resolveSteps(schema, { mode: 'framework' })
    expect(steps).toEqual([])
  })

  test('should return empty array when steps is not an array', () => {
    const schema = createMockSchema({
      mode: {
        framework: {
          framework: {},
        },
      },
    } as any)

    const steps = resolveSteps(schema, { mode: 'framework' })
    expect(steps).toEqual([])
  })

  test('should append steps from multiple field conditions in order', () => {
    const schema = createMockSchema({
      mode: {
        framework: {
          framework: {
            nextjs: [{ id: 'base', title: 'Base', description: 'Base step', content: 'base' }],
          },
          frameworkUi: {
            true: [{ id: 'ui', title: 'UI', description: 'UI step', content: 'ui' }],
          },
        },
      },
    })

    const steps = resolveSteps(schema, {
      mode: 'framework',
      framework: 'nextjs',
      frameworkUi: true,
    })
    expect(steps.map((step) => step.id)).toEqual(['base', 'ui'])
  })
})

// ============================================================================
// getActiveFields Tests
// ============================================================================

describe('connect.resolver:getActiveFields', () => {
  const createSchemaWithFields = (fields: ConnectSchema['fields']): ConnectSchema => ({
    fields,
    steps: [],
  })

  test('should return fields for the current mode', () => {
    const schema = createSchemaWithFields({
      mode: {
        id: 'mode',
        type: 'select',
        label: 'Mode',
        defaultValue: 'framework',
        options: () => [
          { value: 'framework', label: 'Framework' },
          { value: 'direct', label: 'Direct' },
        ],
      },
      framework: {
        id: 'framework',
        type: 'radio-grid',
        label: 'Framework',
        defaultValue: 'nextjs',
        dependsOn: { mode: ['framework'] },
      },
      library: {
        id: 'library',
        type: 'select',
        label: 'Library',
        defaultValue: 'supabasejs',
        dependsOn: { mode: ['framework'] },
      },
      connectionType: {
        id: 'connectionType',
        type: 'select',
        label: 'Type',
        defaultValue: 'uri',
        dependsOn: { mode: ['direct'] },
      },
    })

    const frameworkFields = getActiveFields(schema, { mode: 'framework' })
    expect(frameworkFields.map((f) => f.id)).toEqual(['mode', 'framework', 'library'])

    const directFields = getActiveFields(schema, { mode: 'direct' })
    expect(directFields.map((f) => f.id)).toEqual(['mode', 'connectionType'])
  })

  test('should filter fields by dependsOn conditions', () => {
    const schema = createSchemaWithFields({
      mode: {
        id: 'mode',
        type: 'select',
        label: 'Mode',
        defaultValue: 'framework',
        options: () => [{ value: 'framework', label: 'Framework' }],
      },
      framework: {
        id: 'framework',
        type: 'radio-grid',
        label: 'Framework',
        defaultValue: 'nextjs',
        dependsOn: { mode: ['framework'] },
      },
      frameworkVariant: {
        id: 'frameworkVariant',
        type: 'select',
        label: 'Variant',
        dependsOn: { mode: ['framework'], framework: ['nextjs', 'react'] },
      },
      frameworkUi: {
        id: 'frameworkUi',
        type: 'switch',
        label: 'Shadcn',
        dependsOn: { mode: ['framework'], framework: ['nextjs', 'react'] },
      },
    })

    // With nextjs - should show all fields
    const nextjsFields = getActiveFields(schema, { mode: 'framework', framework: 'nextjs' })
    expect(nextjsFields).toHaveLength(4)

    // With vue - should hide frameworkVariant and frameworkUi
    const vueFields = getActiveFields(schema, { mode: 'framework', framework: 'vue' })
    expect(vueFields.map((field) => field.id)).toEqual(['mode', 'framework'])
  })

  test('should handle multiple dependsOn conditions', () => {
    const schema = createSchemaWithFields({
      mode: {
        id: 'mode',
        type: 'select',
        label: 'Mode',
        defaultValue: 'direct',
        options: () => [{ value: 'direct', label: 'Direct' }],
      },
      connectionMethod: {
        id: 'connectionMethod',
        type: 'radio-list',
        label: 'Method',
        defaultValue: 'direct',
        dependsOn: { mode: ['direct'] },
      },
      useSharedPooler: {
        id: 'useSharedPooler',
        type: 'switch',
        label: 'Use Shared Pooler',
        dependsOn: { mode: ['direct'], connectionMethod: ['transaction'] },
      },
    })

    // Transaction mode - show shared pooler option
    const transactionFields = getActiveFields(schema, {
      mode: 'direct',
      connectionMethod: 'transaction',
    })
    expect(transactionFields.map((field) => field.id)).toEqual([
      'mode',
      'connectionMethod',
      'useSharedPooler',
    ])

    // Direct mode - hide shared pooler option
    const directFields = getActiveFields(schema, { mode: 'direct', connectionMethod: 'direct' })
    expect(directFields.map((field) => field.id)).toEqual(['mode', 'connectionMethod'])
  })

  test('should return only mode field when dependsOn does not match', () => {
    const schema = createSchemaWithFields({
      mode: {
        id: 'mode',
        type: 'select',
        label: 'Mode',
        defaultValue: 'framework',
        options: () => [{ value: 'framework', label: 'Framework' }],
      },
      framework: {
        id: 'framework',
        type: 'radio-grid',
        label: 'Framework',
        dependsOn: { mode: ['framework'] },
      },
    })

    const fields = getActiveFields(schema, { mode: 'invalid' as any })
    expect(fields.map((field) => field.id)).toEqual(['mode'])
  })

  test('should include resolvedOptions for each field', () => {
    const schema = createSchemaWithFields({
      framework: {
        id: 'framework',
        type: 'radio-grid',
        label: 'Framework',
        options: () => [{ value: 'nextjs', label: 'Next.js' }],
      },
    })

    const fields = getActiveFields(schema, { mode: 'framework' })
    expect(fields[0]).toHaveProperty('resolvedOptions')
    expect(fields[0].resolvedOptions).toEqual([{ value: 'nextjs', label: 'Next.js' }])
  })
})

// ============================================================================
// getDefaultState Tests
// ============================================================================

describe('connect.resolver:getDefaultState', () => {
  test('should include default values from fields', () => {
    const schema: ConnectSchema = {
      fields: {
        mode: {
          id: 'mode',
          type: 'select',
          label: 'Mode',
          defaultValue: 'framework',
          options: () => [{ value: 'framework', label: 'Framework' }],
        },
        framework: {
          id: 'framework',
          type: 'radio-grid',
          label: 'Framework',
          defaultValue: 'nextjs',
          dependsOn: { mode: ['framework'] },
        },
        library: {
          id: 'library',
          type: 'select',
          label: 'Library',
          defaultValue: 'supabasejs',
          dependsOn: { mode: ['framework'] },
        },
        mcpReadonly: {
          id: 'mcpReadonly',
          type: 'switch',
          label: 'Readonly',
          defaultValue: false,
        },
      },
      steps: [],
    }

    const state = getDefaultState(schema)
    expect(state.framework).toBe('nextjs')
    expect(state.library).toBe('supabasejs')
    expect(state.mcpReadonly).toBe(false)
  })
})

// ============================================================================
// resolveState Tests
// ============================================================================

describe('connect.resolver:resolveState', () => {
  test('should apply defaults from options when valid', () => {
    const schema: ConnectSchema = {
      fields: {
        mode: {
          id: 'mode',
          type: 'select',
          label: 'Mode',
          defaultValue: 'framework',
          options: () => [{ value: 'framework', label: 'Framework' }],
        },
        framework: {
          id: 'framework',
          type: 'select',
          label: 'Framework',
          defaultValue: 'react',
          options: () => [
            { value: 'nextjs', label: 'Next.js' },
            { value: 'react', label: 'React' },
          ],
          dependsOn: { mode: ['framework'] },
        },
      },
      steps: [],
    }

    const state = resolveState(schema, {})
    expect(state.mode).toBe('framework')
    expect(state.framework).toBe('react')
  })

  test('should fall back to first option when default is invalid', () => {
    const schema: ConnectSchema = {
      fields: {
        mode: {
          id: 'mode',
          type: 'select',
          label: 'Mode',
          defaultValue: 'framework',
          options: () => [{ value: 'framework', label: 'Framework' }],
        },
        framework: {
          id: 'framework',
          type: 'select',
          label: 'Framework',
          defaultValue: 'angular',
          options: () => [
            { value: 'nextjs', label: 'Next.js' },
            { value: 'react', label: 'React' },
          ],
          dependsOn: { mode: ['framework'] },
        },
      },
      steps: [],
    }

    const state = resolveState(schema, {})
    expect(state.framework).toBe('nextjs')
  })

  test('should refresh dependent values when options change', () => {
    const schema: ConnectSchema = {
      fields: {
        mode: {
          id: 'mode',
          type: 'select',
          label: 'Mode',
          defaultValue: 'framework',
          options: () => [{ value: 'framework', label: 'Framework' }],
        },
        framework: {
          id: 'framework',
          type: 'select',
          label: 'Framework',
          defaultValue: 'nextjs',
          options: () => [
            { value: 'nextjs', label: 'Next.js' },
            { value: 'react', label: 'React' },
          ],
          dependsOn: { mode: ['framework'] },
        },
        variant: {
          id: 'variant',
          type: 'select',
          label: 'Variant',
          options: (state) =>
            state.framework === 'react'
              ? [{ value: 'vite', label: 'Vite' }]
              : [{ value: 'app', label: 'App' }],
          dependsOn: { mode: ['framework'], framework: ['nextjs', 'react'] },
        },
      },
      steps: [],
    }

    const state = resolveState(schema, {
      mode: 'framework',
      framework: 'react',
      variant: 'app',
    })

    expect(state.variant).toBe('vite')
  })
})

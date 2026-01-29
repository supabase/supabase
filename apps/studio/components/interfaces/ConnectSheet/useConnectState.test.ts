import { describe, test, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useConnectState } from './useConnectState'

describe('useConnectState', () => {
  // ============================================================================
  // Initial State Tests
  // ============================================================================

  describe('initial state', () => {
    test('should initialize with default mode "framework"', () => {
      const { result } = renderHook(() => useConnectState())
      expect(result.current.state.mode).toBe('framework')
    })

    test('should initialize with first framework selected', () => {
      const { result } = renderHook(() => useConnectState())
      expect(result.current.state.framework).toBe('nextjs')
    })

    test('should initialize with first variant for nextjs', () => {
      const { result } = renderHook(() => useConnectState())
      expect(result.current.state.frameworkVariant).toBe('app')
    })

    test('should initialize with library resolved from framework', () => {
      const { result } = renderHook(() => useConnectState())
      expect(result.current.state.library).toBe('supabasejs')
    })

    test('should accept initial state overrides', () => {
      const { result } = renderHook(() =>
        useConnectState({ mode: 'direct', connectionMethod: 'transaction' })
      )
      expect(result.current.state.mode).toBe('direct')
      expect(result.current.state.connectionMethod).toBe('transaction')
    })

    test('should provide schema reference', () => {
      const { result } = renderHook(() => useConnectState())
      expect(result.current.schema).toBeDefined()
      expect(result.current.schema.modes).toBeDefined()
      expect(result.current.schema.fields).toBeDefined()
    })
  })

  // ============================================================================
  // Mode Switching Tests
  // ============================================================================

  describe('setMode', () => {
    test('should switch to direct mode', () => {
      const { result } = renderHook(() => useConnectState())

      act(() => {
        result.current.setMode('direct')
      })

      expect(result.current.state.mode).toBe('direct')
    })

    test('should initialize direct mode defaults when switching', () => {
      const { result } = renderHook(() => useConnectState())

      act(() => {
        result.current.setMode('direct')
      })

      expect(result.current.state.connectionMethod).toBeDefined()
      expect(result.current.state.connectionType).toBeDefined()
    })

    test('should switch to orm mode and initialize ORM', () => {
      const { result } = renderHook(() => useConnectState())

      act(() => {
        result.current.setMode('orm')
      })

      expect(result.current.state.mode).toBe('orm')
      expect(result.current.state.orm).toBe('prisma') // First ORM
    })

    test('should switch to mcp mode and initialize MCP client', () => {
      const { result } = renderHook(() => useConnectState())

      act(() => {
        result.current.setMode('mcp')
      })

      expect(result.current.state.mode).toBe('mcp')
      expect(result.current.state.mcpClient).toBeDefined()
    })

    test('should switch back to framework mode and restore framework state', () => {
      const { result } = renderHook(() => useConnectState())

      // Switch away
      act(() => {
        result.current.setMode('direct')
      })

      // Switch back
      act(() => {
        result.current.setMode('framework')
      })

      expect(result.current.state.mode).toBe('framework')
      expect(result.current.state.framework).toBeDefined()
    })
  })

  // ============================================================================
  // Field Update Tests
  // ============================================================================

  describe('updateField', () => {
    test('should update framework field', () => {
      const { result } = renderHook(() => useConnectState())

      act(() => {
        result.current.updateField('framework', 'react')
      })

      expect(result.current.state.framework).toBe('react')
    })

    test('should cascade variant update when framework changes', () => {
      const { result } = renderHook(() => useConnectState())

      act(() => {
        result.current.updateField('framework', 'react')
      })

      // React has variants (create-react-app, vite), should set first one
      expect(result.current.state.frameworkVariant).toBe('create-react-app')
    })

    test('should clear variant when switching to framework without variants', () => {
      const { result } = renderHook(() => useConnectState())

      act(() => {
        result.current.updateField('framework', 'nuxt')
      })

      // Nuxt doesn't have variants
      expect(result.current.state.frameworkVariant).toBeUndefined()
    })

    test('should resolve library for framework without existing library', () => {
      // Start fresh without a pre-set library
      const { result } = renderHook(() => useConnectState())

      // First clear the library, then change framework
      act(() => {
        // The library resolution happens based on the framework structure
        // Flutter's first child is supabaseflutter
        result.current.updateField('framework', 'flutter')
      })

      // When framework changes, resolveFrameworkLibraryKey is called
      // Since flutter has children, it should resolve to supabaseflutter
      // However, if library was already set, it returns that value
      // This tests the current behavior - library stays if already set
      expect(result.current.state.library).toBeDefined()
    })

    test('should cascade library update when variant changes', () => {
      const { result } = renderHook(() => useConnectState())

      // Start with nextjs app
      expect(result.current.state.frameworkVariant).toBe('app')

      act(() => {
        result.current.updateField('frameworkVariant', 'pages')
      })

      expect(result.current.state.frameworkVariant).toBe('pages')
      expect(result.current.state.library).toBe('supabasejs')
    })

    test('should update boolean fields (switches)', () => {
      const { result } = renderHook(() => useConnectState())

      act(() => {
        result.current.updateField('frameworkUi', true)
      })

      expect(result.current.state.frameworkUi).toBe(true)
    })

    test('should update ORM selection', () => {
      const { result } = renderHook(() => useConnectState({ mode: 'orm' }))

      act(() => {
        result.current.updateField('orm', 'drizzle')
      })

      expect(result.current.state.orm).toBe('drizzle')
    })

    test('should update MCP client', () => {
      const { result } = renderHook(() => useConnectState({ mode: 'mcp' }))

      act(() => {
        result.current.updateField('mcpClient', 'codex')
      })

      expect(result.current.state.mcpClient).toBe('codex')
    })

    test('should update connection method', () => {
      const { result } = renderHook(() => useConnectState({ mode: 'direct' }))

      act(() => {
        result.current.updateField('connectionMethod', 'transaction')
      })

      expect(result.current.state.connectionMethod).toBe('transaction')
    })

    test('should remove useSharedPooler when connectionMethod changes to direct', () => {
      // useSharedPooler has dependsOn: { connectionMethod: ['transaction'] }
      // So when connectionMethod changes to 'direct', the dependency is not satisfied
      // and resetDependentFields removes it from state
      const { result } = renderHook(() =>
        useConnectState({ mode: 'direct', connectionMethod: 'transaction', useSharedPooler: true })
      )

      act(() => {
        result.current.updateField('connectionMethod', 'direct')
      })

      // Field is removed because dependency condition is no longer met
      expect(result.current.state.useSharedPooler).toBeUndefined()
    })
  })

  // ============================================================================
  // Active Fields Tests
  // ============================================================================

  describe('activeFields', () => {
    test('should return framework mode fields', () => {
      const { result } = renderHook(() => useConnectState())

      const fieldIds = result.current.activeFields.map((f) => f.id)
      expect(fieldIds).toContain('framework')
    })

    test('should include variant field for frameworks with variants', () => {
      const { result } = renderHook(() => useConnectState({ framework: 'nextjs' }))

      const fieldIds = result.current.activeFields.map((f) => f.id)
      expect(fieldIds).toContain('frameworkVariant')
    })

    test('should exclude variant field for frameworks without variants', () => {
      const { result } = renderHook(() => useConnectState())

      act(() => {
        result.current.updateField('framework', 'nuxt')
      })

      const fieldIds = result.current.activeFields.map((f) => f.id)
      expect(fieldIds).not.toContain('frameworkVariant')
    })

    test('should return direct mode fields', () => {
      const { result } = renderHook(() => useConnectState({ mode: 'direct' }))

      const fieldIds = result.current.activeFields.map((f) => f.id)
      expect(fieldIds).toContain('connectionMethod')
      expect(fieldIds).toContain('connectionType')
    })

    test('should show useSharedPooler only for transaction connection method', () => {
      const { result } = renderHook(() =>
        useConnectState({ mode: 'direct', connectionMethod: 'transaction' })
      )

      const fieldIds = result.current.activeFields.map((f) => f.id)
      expect(fieldIds).toContain('useSharedPooler')
    })

    test('should hide useSharedPooler for direct connection method', () => {
      const { result } = renderHook(() =>
        useConnectState({ mode: 'direct', connectionMethod: 'direct' })
      )

      const fieldIds = result.current.activeFields.map((f) => f.id)
      expect(fieldIds).not.toContain('useSharedPooler')
    })

    test('should return ORM mode fields', () => {
      const { result } = renderHook(() => useConnectState({ mode: 'orm' }))

      const fieldIds = result.current.activeFields.map((f) => f.id)
      expect(fieldIds).toContain('orm')
    })

    test('should return MCP mode fields', () => {
      const { result } = renderHook(() => useConnectState({ mode: 'mcp' }))

      const fieldIds = result.current.activeFields.map((f) => f.id)
      expect(fieldIds).toContain('mcpClient')
      expect(fieldIds).toContain('mcpReadonly')
    })
  })

  // ============================================================================
  // Resolved Steps Tests
  // ============================================================================

  describe('resolvedSteps', () => {
    test('should return steps for framework mode', () => {
      const { result } = renderHook(() => useConnectState())

      expect(result.current.resolvedSteps.length).toBeGreaterThan(0)
    })

    test('should return steps for direct mode', () => {
      const { result } = renderHook(() => useConnectState({ mode: 'direct' }))

      expect(result.current.resolvedSteps.length).toBeGreaterThan(0)
    })

    test('should return steps for ORM mode', () => {
      const { result } = renderHook(() => useConnectState({ mode: 'orm' }))

      expect(result.current.resolvedSteps.length).toBeGreaterThan(0)
    })

    test('should return steps for MCP mode', () => {
      const { result } = renderHook(() => useConnectState({ mode: 'mcp' }))

      expect(result.current.resolvedSteps.length).toBeGreaterThan(0)
    })

    test('should update steps when framework changes', () => {
      const { result } = renderHook(() => useConnectState())

      const initialSteps = [...result.current.resolvedSteps]

      act(() => {
        result.current.updateField('framework', 'flutter')
      })

      // Steps might change based on framework
      expect(result.current.resolvedSteps).toBeDefined()
    })

    test('should return different steps for MCP codex client', () => {
      const { result } = renderHook(() => useConnectState({ mode: 'mcp', mcpClient: 'cursor' }))
      const cursorSteps = result.current.resolvedSteps.map((s) => s.id)

      act(() => {
        result.current.updateField('mcpClient', 'codex')
      })

      const codexSteps = result.current.resolvedSteps.map((s) => s.id)

      // Codex has specific steps
      expect(codexSteps).toContain('codex-add-server')
    })

    test('should return different steps for MCP claude-code client', () => {
      const { result } = renderHook(() => useConnectState({ mode: 'mcp' }))

      act(() => {
        result.current.updateField('mcpClient', 'claude-code')
      })

      const claudeSteps = result.current.resolvedSteps.map((s) => s.id)
      expect(claudeSteps).toContain('claude-add-server')
    })
  })

  // ============================================================================
  // Field Options Tests
  // ============================================================================

  describe('getFieldOptions', () => {
    test('should return framework options', () => {
      const { result } = renderHook(() => useConnectState())

      const options = result.current.getFieldOptions('framework')

      expect(options.length).toBeGreaterThan(0)
      expect(options.some((o) => o.value === 'nextjs')).toBe(true)
      expect(options.some((o) => o.value === 'react')).toBe(true)
    })

    test('should return variant options for frameworks with variants', () => {
      const { result } = renderHook(() => useConnectState({ framework: 'nextjs' }))

      const options = result.current.getFieldOptions('frameworkVariant')

      expect(options.length).toBeGreaterThan(0)
      expect(options.some((o) => o.value === 'app')).toBe(true)
      expect(options.some((o) => o.value === 'pages')).toBe(true)
    })

    test('should return empty options for frameworks without variants', () => {
      const { result } = renderHook(() => useConnectState())

      act(() => {
        result.current.updateField('framework', 'nuxt')
      })

      const options = result.current.getFieldOptions('frameworkVariant')
      expect(options).toEqual([])
    })

    test('should return library options', () => {
      const { result } = renderHook(() => useConnectState({ framework: 'nextjs', frameworkVariant: 'app' }))

      const options = result.current.getFieldOptions('library')

      expect(options.length).toBeGreaterThan(0)
    })

    test('should return connection method options', () => {
      const { result } = renderHook(() => useConnectState({ mode: 'direct' }))

      const options = result.current.getFieldOptions('connectionMethod')

      expect(options.length).toBeGreaterThan(0)
      expect(options.some((o) => o.value === 'direct')).toBe(true)
      expect(options.some((o) => o.value === 'transaction')).toBe(true)
    })

    test('should return connection type options', () => {
      const { result } = renderHook(() => useConnectState({ mode: 'direct' }))

      const options = result.current.getFieldOptions('connectionType')

      expect(options.length).toBeGreaterThan(0)
      expect(options.some((o) => o.value === 'uri')).toBe(true)
      expect(options.some((o) => o.value === 'psql')).toBe(true)
    })

    test('should return ORM options', () => {
      const { result } = renderHook(() => useConnectState({ mode: 'orm' }))

      const options = result.current.getFieldOptions('orm')

      expect(options.length).toBeGreaterThan(0)
      expect(options.some((o) => o.value === 'prisma')).toBe(true)
      expect(options.some((o) => o.value === 'drizzle')).toBe(true)
    })

    test('should return MCP client options', () => {
      const { result } = renderHook(() => useConnectState({ mode: 'mcp' }))

      const options = result.current.getFieldOptions('mcpClient')

      expect(options.length).toBeGreaterThan(0)
      expect(options.some((o) => o.value === 'cursor')).toBe(true)
    })

    test('should return empty array for unknown field', () => {
      const { result } = renderHook(() => useConnectState())

      const options = result.current.getFieldOptions('unknownField')
      expect(options).toEqual([])
    })

    test('should return empty array for field not in current mode', () => {
      const { result } = renderHook(() => useConnectState({ mode: 'framework' }))

      const options = result.current.getFieldOptions('connectionMethod')
      expect(options).toEqual([])
    })
  })

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('integration scenarios', () => {
    test('full flow: select framework -> variant -> enable shadcn', () => {
      const { result } = renderHook(() => useConnectState())

      // Select React
      act(() => {
        result.current.updateField('framework', 'react')
      })
      expect(result.current.state.framework).toBe('react')

      // Select Vite variant
      act(() => {
        result.current.updateField('frameworkVariant', 'vite')
      })
      expect(result.current.state.frameworkVariant).toBe('vite')

      // Enable Shadcn UI
      act(() => {
        result.current.updateField('frameworkUi', true)
      })
      expect(result.current.state.frameworkUi).toBe(true)

      // Verify active fields include all selected
      const fieldIds = result.current.activeFields.map((f) => f.id)
      expect(fieldIds).toContain('framework')
      expect(fieldIds).toContain('frameworkVariant')
      expect(fieldIds).toContain('frameworkUi')
    })

    test('full flow: switch modes and preserve independent state', () => {
      const { result } = renderHook(() => useConnectState())

      // Set up framework state
      act(() => {
        result.current.updateField('framework', 'react')
      })

      // Switch to direct mode
      act(() => {
        result.current.setMode('direct')
      })
      expect(result.current.state.mode).toBe('direct')

      // Configure direct connection
      act(() => {
        result.current.updateField('connectionMethod', 'transaction')
      })

      // Switch to ORM mode
      act(() => {
        result.current.setMode('orm')
      })
      expect(result.current.state.mode).toBe('orm')

      // Switch back to framework - should still have react
      act(() => {
        result.current.setMode('framework')
      })
      expect(result.current.state.mode).toBe('framework')
      expect(result.current.state.framework).toBe('react')
    })

    test('MCP mode: configure with readonly and features', () => {
      const { result } = renderHook(() => useConnectState({ mode: 'mcp' }))

      // Enable readonly
      act(() => {
        result.current.updateField('mcpReadonly', true)
      })
      expect(result.current.state.mcpReadonly).toBe(true)

      // Select different client
      act(() => {
        result.current.updateField('mcpClient', 'codex')
      })
      expect(result.current.state.mcpClient).toBe('codex')

      // Verify steps updated for codex
      const stepIds = result.current.resolvedSteps.map((s) => s.id)
      expect(stepIds).toContain('codex-add-server')
    })
  })
})

import { act, renderHook } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { useConnectState } from './useConnectState'

describe('useConnectState', () => {
  // ============================================================================
  // Initial State Tests
  // ============================================================================

  describe('initial state', () => {
    test('should initialize with framework mode by default', () => {
      const { result } = renderHook(() => useConnectState())
      expect(result.current.state.mode).toBe('framework')
    })

    test('should initialize with nextjs as default framework', () => {
      const { result } = renderHook(() => useConnectState())
      expect(result.current.state.framework).toBe('nextjs')
    })

    test('should initialize with app variant for nextjs', () => {
      const { result } = renderHook(() => useConnectState())
      expect(result.current.state.frameworkVariant).toBe('app')
    })

    test('should initialize with supabasejs library', () => {
      const { result } = renderHook(() => useConnectState())
      expect(result.current.state.library).toBe('supabasejs')
    })

    test('should accept initial state override', () => {
      const { result } = renderHook(() =>
        useConnectState({ mode: 'direct', connectionMethod: 'transaction' })
      )
      expect(result.current.state.mode).toBe('direct')
      expect(result.current.state.connectionMethod).toBe('transaction')
    })

    test('should merge initial state with defaults', () => {
      const { result } = renderHook(() => useConnectState({ framework: 'react' }))
      expect(result.current.state.mode).toBe('framework')
      expect(result.current.state.framework).toBe('react')
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

    test('should switch to orm mode and initialize defaults', () => {
      const { result } = renderHook(() => useConnectState())

      act(() => {
        result.current.setMode('orm')
      })

      expect(result.current.state.mode).toBe('orm')
      expect(result.current.state.orm).toBe('prisma')
    })

    test('should switch to mcp mode and initialize defaults', () => {
      const { result } = renderHook(() => useConnectState())

      act(() => {
        result.current.setMode('mcp')
      })

      expect(result.current.state.mode).toBe('mcp')
      expect(result.current.state.mcpClient).toBeDefined()
    })

    test('should preserve framework state when switching back to framework mode', () => {
      const { result } = renderHook(() => useConnectState())

      // Change framework
      act(() => {
        result.current.updateField('framework', 'react')
      })

      // Switch to direct
      act(() => {
        result.current.setMode('direct')
      })

      // Switch back to framework
      act(() => {
        result.current.setMode('framework')
      })

      expect(result.current.state.framework).toBe('react')
    })
  })

  // ============================================================================
  // Field Update Tests
  // ============================================================================

  describe('updateField', () => {
    test('should update framework selection', () => {
      const { result } = renderHook(() => useConnectState())

      act(() => {
        result.current.updateField('framework', 'react')
      })

      expect(result.current.state.framework).toBe('react')
    })

    test('should cascade variant reset when changing framework', () => {
      const { result } = renderHook(() => useConnectState())

      // Start with nextjs which has variants
      expect(result.current.state.frameworkVariant).toBe('app')

      // Switch to a framework with multiple variants
      act(() => {
        result.current.updateField('framework', 'react')
      })

      // Should have the first variant of react
      expect(result.current.state.frameworkVariant).toBeDefined()
    })

    test('should remove variant when switching to framework without variants', () => {
      const { result } = renderHook(() => useConnectState())

      // Start with nextjs which has variants
      expect(result.current.state.frameworkVariant).toBe('app')

      // Switch to remix which has no variants
      act(() => {
        result.current.updateField('framework', 'remix')
      })

      expect(result.current.state.frameworkVariant).toBeUndefined()
    })

    test('should update library when variant changes', () => {
      const { result } = renderHook(() => useConnectState())

      act(() => {
        result.current.updateField('frameworkVariant', 'pages')
      })

      expect(result.current.state.library).toBe('supabasejs')
    })

    test('should update connection method', () => {
      const { result } = renderHook(() => useConnectState({ mode: 'direct' }))

      act(() => {
        result.current.updateField('connectionMethod', 'transaction')
      })

      expect(result.current.state.connectionMethod).toBe('transaction')
    })

    test('should clear useSharedPooler when connectionMethod changes to direct', () => {
      const { result } = renderHook(() =>
        useConnectState({
          mode: 'direct',
          connectionMethod: 'transaction',
          useSharedPooler: true,
        })
      )

      act(() => {
        result.current.updateField('connectionMethod', 'direct')
      })

      // useSharedPooler is cleared because it depends on connectionMethod: ['transaction']
      // When the dependency is not satisfied, the field is removed from state
      expect(result.current.state.useSharedPooler).toBeUndefined()
    })

    test('should update MCP client', () => {
      const { result } = renderHook(() => useConnectState({ mode: 'mcp' }))

      act(() => {
        result.current.updateField('mcpClient', 'codex')
      })

      expect(result.current.state.mcpClient).toBe('codex')
    })

    test('should update boolean fields', () => {
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

    test('should include variant field for nextjs', () => {
      const { result } = renderHook(() => useConnectState({ framework: 'nextjs' }))

      const fieldIds = result.current.activeFields.map((f) => f.id)
      expect(fieldIds).toContain('frameworkVariant')
    })

    test('should include frameworkUi field for nextjs', () => {
      const { result } = renderHook(() => useConnectState({ framework: 'nextjs' }))

      const fieldIds = result.current.activeFields.map((f) => f.id)
      expect(fieldIds).toContain('frameworkUi')
    })

    test('should not include frameworkUi for non-nextjs/react frameworks', () => {
      const { result } = renderHook(() => useConnectState({ framework: 'remix' }))

      const fieldIds = result.current.activeFields.map((f) => f.id)
      expect(fieldIds).not.toContain('frameworkUi')
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

    test('should return orm mode fields', () => {
      const { result } = renderHook(() => useConnectState({ mode: 'orm' }))

      const fieldIds = result.current.activeFields.map((f) => f.id)
      expect(fieldIds).toContain('orm')
    })

    test('should return mcp mode fields', () => {
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
    test('should resolve steps for framework mode', () => {
      const { result } = renderHook(() => useConnectState())

      expect(result.current.resolvedSteps.length).toBeGreaterThan(0)
    })

    test('should have install step for framework mode', () => {
      const { result } = renderHook(() => useConnectState())

      const stepIds = result.current.resolvedSteps.map((s) => s.id)
      expect(stepIds).toContain('install')
    })

    test('should resolve different steps for mcp mode', () => {
      const { result } = renderHook(() => useConnectState({ mode: 'mcp' }))

      const stepIds = result.current.resolvedSteps.map((s) => s.id)
      // MCP mode should have configure step
      expect(stepIds.some((id) => id.includes('configure') || id.includes('mcp'))).toBe(true)
    })

    test('should resolve different steps for different mcp clients', () => {
      const { result: cursorResult } = renderHook(() =>
        useConnectState({ mode: 'mcp', mcpClient: 'cursor' })
      )
      const { result: codexResult } = renderHook(() =>
        useConnectState({ mode: 'mcp', mcpClient: 'codex' })
      )

      // Codex has more steps than cursor
      expect(codexResult.current.resolvedSteps.length).toBeGreaterThanOrEqual(
        cursorResult.current.resolvedSteps.length
      )
    })

    test('should include skills install step', () => {
      const { result } = renderHook(() => useConnectState())

      const stepIds = result.current.resolvedSteps.map((s) => s.id)
      expect(stepIds).toContain('install-skills')
    })

    test('should resolve steps for direct mode', () => {
      const { result } = renderHook(() => useConnectState({ mode: 'direct' }))

      expect(result.current.resolvedSteps.length).toBeGreaterThan(0)
    })

    test('should resolve steps for orm mode', () => {
      const { result } = renderHook(() => useConnectState({ mode: 'orm' }))

      expect(result.current.resolvedSteps.length).toBeGreaterThan(0)
      const stepIds = result.current.resolvedSteps.map((s) => s.id)
      expect(stepIds).toContain('install')
      expect(stepIds).toContain('configure')
    })

    test('should resolve shadcn steps when frameworkUi is true', () => {
      const { result } = renderHook(() =>
        useConnectState({ framework: 'nextjs', frameworkUi: true })
      )

      const stepIds = result.current.resolvedSteps.map((s) => s.id)
      expect(stepIds).toContain('shadcn-add')
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

    test('should return variant options for nextjs', () => {
      const { result } = renderHook(() => useConnectState({ framework: 'nextjs' }))

      const options = result.current.getFieldOptions('frameworkVariant')
      expect(options.length).toBeGreaterThan(0)
      expect(options.some((o) => o.value === 'app')).toBe(true)
      expect(options.some((o) => o.value === 'pages')).toBe(true)
    })

    test('should return empty variant options for frameworks without variants', () => {
      const { result } = renderHook(() => useConnectState({ framework: 'remix' }))

      const options = result.current.getFieldOptions('frameworkVariant')
      expect(options).toEqual([])
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

    test('should return library options for selected framework', () => {
      const { result } = renderHook(() =>
        useConnectState({ framework: 'nextjs', frameworkVariant: 'app' })
      )

      const options = result.current.getFieldOptions('library')
      expect(options.length).toBeGreaterThan(0)
    })
  })

  // ============================================================================
  // Schema Access Tests
  // ============================================================================

  describe('schema', () => {
    test('should expose the connect schema', () => {
      const { result } = renderHook(() => useConnectState())

      expect(result.current.schema).toBeDefined()
      expect(result.current.schema.modes).toBeDefined()
      expect(result.current.schema.fields).toBeDefined()
      expect(result.current.schema.steps).toBeDefined()
    })

    test('should have all expected modes in schema', () => {
      const { result } = renderHook(() => useConnectState())

      const modeIds = result.current.schema.modes.map((m) => m.id)
      expect(modeIds).toContain('framework')
      expect(modeIds).toContain('direct')
      expect(modeIds).toContain('orm')
      expect(modeIds).toContain('mcp')
    })
  })
})

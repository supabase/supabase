// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { useConnectState } from '../useConnectState'

vi.mock('common', () => ({
  useParams: () => ({ ref: 'test-ref' }),
}))

const readReplicasMock: {
  data: Array<{ identifier: string; region: string; inserted_at: string }>
} = { data: [] }
vi.mock('@/data/read-replicas/replicas-query', () => ({
  useReadReplicasQuery: () => readReplicasMock,
}))

vi.mock('@/hooks/misc/useCheckEntitlements', () => ({
  useCheckEntitlements: vi.fn().mockImplementation(() => ({ hasAccess: true })),
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useIsHighAvailability: vi.fn().mockImplementation(() => false),
}))

const deploymentModeMock = { isPlatform: true, isCli: false, isSelfHosted: false }
vi.mock('@/hooks/misc/useDeploymentMode', () => ({
  useDeploymentMode: () => deploymentModeMock,
}))

type DeploymentMode = typeof deploymentModeMock
const PLATFORM: DeploymentMode = { isPlatform: true, isCli: false, isSelfHosted: false }
const CLI: DeploymentMode = { isPlatform: false, isCli: true, isSelfHosted: false }
const SELF_HOSTED: DeploymentMode = { isPlatform: false, isCli: false, isSelfHosted: true }

const activeFieldIds = (result: { current: ReturnType<typeof useConnectState> }) =>
  result.current.activeFields.map((f) => f.id)

describe('useConnectState', () => {
  // ============================================================================
  // Initial State Tests
  // ============================================================================

  describe('initial state', () => {
    test('should initialize with framework defaults (Next.js app router + supabase-js)', () => {
      const { result } = renderHook(() => useConnectState())
      expect(result.current.state).toMatchObject({
        mode: 'framework',
        framework: 'nextjs',
        frameworkVariant: 'app',
        library: 'supabasejs',
      })
    })

    test('should merge an initial state override with defaults', () => {
      const { result: direct } = renderHook(() =>
        useConnectState({ mode: 'direct', connectionMethod: 'transaction' })
      )
      expect(direct.current.state.mode).toBe('direct')
      expect(direct.current.state.connectionMethod).toBe('transaction')

      const { result: react } = renderHook(() => useConnectState({ framework: 'react' }))
      expect(react.current.state.mode).toBe('framework')
      expect(react.current.state.framework).toBe('react')
    })
  })

  // ============================================================================
  // Mode Switching Tests
  // ============================================================================

  describe('setMode', () => {
    test('should switch to direct mode and initialize its defaults', () => {
      const { result } = renderHook(() => useConnectState())

      act(() => {
        result.current.setMode('direct')
      })

      expect(result.current.state.mode).toBe('direct')
      expect(result.current.state.connectionMethod).toBeDefined()
      expect(result.current.state.connectionType).toBeDefined()
    })

    test.each([
      ['orm', 'orm'],
      ['mcp', 'mcpClient'],
    ] as const)('should switch to %s mode and initialize %s', (mode, field) => {
      const { result } = renderHook(() => useConnectState())

      act(() => {
        result.current.setMode(mode)
      })

      expect(result.current.state.mode).toBe(mode)
      expect(result.current.state[field]).toBeDefined()
    })

    test('should preserve framework state when switching back to framework mode', () => {
      const { result } = renderHook(() => useConnectState())

      act(() => {
        result.current.updateField('framework', 'react')
      })
      act(() => {
        result.current.setMode('direct')
      })
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
    test.each<[Parameters<typeof useConnectState>[0], string, string | boolean]>([
      [undefined, 'framework', 'react'],
      [{ mode: 'direct' }, 'connectionMethod', 'transaction'],
      [{ mode: 'mcp' }, 'mcpClient', 'codex'],
      [{ mode: 'orm' }, 'orm', 'drizzle'],
      [undefined, 'frameworkUi', true],
    ])('%o: should update %s', (initial, fieldId, value) => {
      const { result } = renderHook(() => useConnectState(initial))

      act(() => {
        result.current.updateField(fieldId, value)
      })

      expect(result.current.state[fieldId]).toBe(value)
    })

    test("should reset the variant to the new framework's first variant", () => {
      const { result } = renderHook(() => useConnectState())
      expect(result.current.state.frameworkVariant).toBe('app')

      act(() => {
        result.current.updateField('framework', 'react')
      })

      expect(result.current.state.frameworkVariant).toBeDefined()
      expect(result.current.state.frameworkVariant).not.toBe('app')
    })

    test('should remove variant when switching to framework without variants', () => {
      const { result } = renderHook(() => useConnectState())

      act(() => {
        result.current.updateField('framework', 'remix')
      })

      expect(result.current.state.frameworkVariant).toBeUndefined()
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

      // useSharedPooler depends on connectionMethod: ['transaction'], so it is removed
      expect(result.current.state.useSharedPooler).toBeUndefined()
    })
  })

  // ============================================================================
  // Active Fields Tests
  // ============================================================================

  describe('activeFields', () => {
    test.each<[Parameters<typeof useConnectState>[0], string[], string[]]>([
      [{ framework: 'nextjs' }, ['framework', 'frameworkVariant', 'frameworkUi'], []],
      [{ framework: 'remix' }, ['framework'], ['frameworkUi']],
      [
        { mode: 'direct', connectionMethod: 'direct' },
        ['connectionMethod', 'connectionType'],
        ['useSharedPooler'],
      ],
      [{ mode: 'orm' }, ['orm'], []],
      [{ mode: 'mcp' }, ['mcpClient', 'mcpReadonly'], []],
    ])('%o: includes %j, excludes %j', (initial, included, excluded) => {
      const { result } = renderHook(() => useConnectState(initial))

      const fieldIds = activeFieldIds(result)
      expect(fieldIds).toEqual(expect.arrayContaining(included))
      excluded.forEach((id) => expect(fieldIds).not.toContain(id))
    })

    // `true` last so the module-level entitlement mock is left at its default
    test.each([
      [false, false],
      [true, true],
    ])(
      'transaction method with dedicated_pooler entitlement %s shows useSharedPooler: %s',
      async (hasAccess, isShown) => {
        const { useCheckEntitlements } = await import('@/hooks/misc/useCheckEntitlements')
        vi.mocked(useCheckEntitlements).mockReturnValue({ hasAccess } as any)

        const { result } = renderHook(() =>
          useConnectState({ mode: 'direct', connectionMethod: 'transaction' })
        )

        expect(activeFieldIds(result).includes('useSharedPooler')).toBe(isShown)
      }
    )
  })

  // ============================================================================
  // Resolved Steps Tests (resolution itself is covered in connect.schema.test.ts)
  // ============================================================================

  describe('resolvedSteps', () => {
    test('should resolve steps from the current state', () => {
      const { result } = renderHook(() => useConnectState())
      const stepIds = () => result.current.resolvedSteps.map((s) => s.id)
      expect(stepIds()).toEqual(expect.arrayContaining(['install', 'install-skills']))

      act(() => {
        result.current.updateField('frameworkUi', true)
      })
      expect(stepIds()).toEqual(expect.arrayContaining(['shadcn-add', 'shadcn-env']))
    })
  })

  // ============================================================================
  // Field Options Tests
  // ============================================================================

  describe('getFieldOptions', () => {
    test.each<[Parameters<typeof useConnectState>[0], string, string[]]>([
      [undefined, 'framework', ['nextjs', 'react']],
      [{ framework: 'nextjs' }, 'frameworkVariant', ['app', 'pages']],
      [{ mode: 'direct' }, 'connectionMethod', ['direct', 'transaction']],
      [{ mode: 'direct' }, 'connectionType', ['uri', 'psql']],
      [{ mode: 'orm' }, 'orm', ['prisma', 'drizzle']],
      [{ mode: 'mcp' }, 'mcpClient', ['cursor']],
      [{ framework: 'nextjs', frameworkVariant: 'app' }, 'library', ['supabasejs']],
    ])('%o: %s options include %j', (initial, fieldId, values) => {
      const { result } = renderHook(() => useConnectState(initial))

      const options = result.current.getFieldOptions(fieldId).map((o) => o.value)
      expect(options).toEqual(expect.arrayContaining(values))
    })

    test.each<[Parameters<typeof useConnectState>[0], string]>([
      [{ framework: 'remix' }, 'frameworkVariant'],
      [undefined, 'unknownField'],
    ])('%o: returns no options for %s', (initial, fieldId) => {
      const { result } = renderHook(() => useConnectState(initial))
      expect(result.current.getFieldOptions(fieldId)).toEqual([])
    })
  })

  // ============================================================================
  // High Availability Tests
  // ============================================================================

  describe('high availability projects', () => {
    const PRIMARY_DATABASE = {
      identifier: 'test-ref',
      region: 'ap-southeast-1',
      inserted_at: '2024-01-01T00:00:00Z',
    }
    const REPLICA_DATABASE = {
      identifier: 'test-ref-rr-abcdefgh',
      region: 'ap-southeast-1',
      inserted_at: '2024-01-02T00:00:00Z',
    }

    afterEach(async () => {
      const { useIsHighAvailability } = await import('@/hooks/misc/useSelectedProject')
      vi.mocked(useIsHighAvailability).mockReturnValue(false)
      readReplicasMock.data = []
    })

    test('should offer only the primary and the load balancer as sources for HA projects', async () => {
      const { useIsHighAvailability } = await import('@/hooks/misc/useSelectedProject')
      vi.mocked(useIsHighAvailability).mockReturnValue(true)
      readReplicasMock.data = [PRIMARY_DATABASE, REPLICA_DATABASE]

      const { result } = renderHook(() => useConnectState({ mode: 'direct' }))

      const options = result.current.getFieldOptions('connectionSource')
      expect(options).toEqual([
        { value: 'test-ref', label: 'Primary database' },
        { value: 'load-balancer', label: 'Replica (read-only)' },
      ])
    })

    test('should keep replicas as sources and omit the load balancer for non-HA projects', () => {
      readReplicasMock.data = [PRIMARY_DATABASE, REPLICA_DATABASE]

      const { result } = renderHook(() => useConnectState({ mode: 'direct' }))

      const options = result.current.getFieldOptions('connectionSource')
      expect(options.map((o) => o.value)).toEqual(['test-ref', 'test-ref-rr-abcdefgh'])
      expect(options.some((o) => o.value === 'load-balancer')).toBe(false)
    })

    test('should coerce a replica connection source to the primary for HA projects', async () => {
      const { useIsHighAvailability } = await import('@/hooks/misc/useSelectedProject')
      vi.mocked(useIsHighAvailability).mockReturnValue(true)

      const { result } = renderHook(() =>
        useConnectState({ mode: 'direct', connectionSource: 'test-ref-rr-abcdefgh' })
      )

      expect(result.current.state.connectionSource).toBe('test-ref')
    })

    test('should preserve the load balancer as a valid connection source for HA projects', async () => {
      const { useIsHighAvailability } = await import('@/hooks/misc/useSelectedProject')
      vi.mocked(useIsHighAvailability).mockReturnValue(true)

      const { result } = renderHook(() =>
        useConnectState({ mode: 'direct', connectionSource: 'load-balancer' })
      )

      expect(result.current.state.connectionSource).toBe('load-balancer')
    })

    test('should hide connectionMethod field for HA projects', async () => {
      const { useIsHighAvailability } = await import('@/hooks/misc/useSelectedProject')
      vi.mocked(useIsHighAvailability).mockReturnValue(true)

      const { result } = renderHook(() => useConnectState({ mode: 'direct' }))

      const fieldIds = result.current.activeFields.map((f) => f.id)
      expect(fieldIds).not.toContain('connectionMethod')
    })

    test('should hide useSharedPooler field for HA projects', async () => {
      const { useIsHighAvailability } = await import('@/hooks/misc/useSelectedProject')
      vi.mocked(useIsHighAvailability).mockReturnValue(true)

      const { result } = renderHook(() =>
        useConnectState({ mode: 'direct', connectionMethod: 'transaction' })
      )

      const fieldIds = result.current.activeFields.map((f) => f.id)
      expect(fieldIds).not.toContain('useSharedPooler')
    })

    test('should rename connectionType label to "Connection Type" for HA projects', async () => {
      const { useIsHighAvailability } = await import('@/hooks/misc/useSelectedProject')
      vi.mocked(useIsHighAvailability).mockReturnValue(true)

      const { result } = renderHook(() => useConnectState({ mode: 'direct' }))

      const connectionTypeField = result.current.activeFields.find((f) => f.id === 'connectionType')
      expect(connectionTypeField?.label).toBe('Connection Type')
    })

    test('should coerce pooler-flavored initial state to the direct method for HA projects', async () => {
      const { useIsHighAvailability } = await import('@/hooks/misc/useSelectedProject')
      vi.mocked(useIsHighAvailability).mockReturnValue(true)

      // Simulates pooler selections restored from the URL or localStorage
      const { result } = renderHook(() =>
        useConnectState({ mode: 'direct', connectionMethod: 'transaction', useSharedPooler: true })
      )

      expect(result.current.state.connectionMethod).toBe('direct')
      expect(result.current.state.useSharedPooler).toBe(false)
    })

    test('should coerce connectionMethod updates to the direct method for HA projects', async () => {
      const { useIsHighAvailability } = await import('@/hooks/misc/useSelectedProject')
      vi.mocked(useIsHighAvailability).mockReturnValue(true)

      const { result } = renderHook(() => useConnectState({ mode: 'direct' }))

      act(() => {
        result.current.updateField('connectionMethod', 'session')
        result.current.updateField('useSharedPooler', true)
      })

      expect(result.current.state.connectionMethod).toBe('direct')
      expect(result.current.state.useSharedPooler).toBe(false)
    })

    test('should not affect non-HA projects', async () => {
      const { useIsHighAvailability } = await import('@/hooks/misc/useSelectedProject')
      vi.mocked(useIsHighAvailability).mockReturnValue(false)

      const { result } = renderHook(() => useConnectState({ mode: 'direct' }))

      const fieldIds = result.current.activeFields.map((f) => f.id)
      expect(fieldIds).toContain('connectionMethod')
      expect(fieldIds).toContain('connectionType')

      const connectionTypeField = result.current.activeFields.find((f) => f.id === 'connectionType')
      expect(connectionTypeField?.label).toBe('Type')
    })
  })

  // ============================================================================
  // Deployment-Mode-Aware Tests
  // ============================================================================

  describe('deployment mode', () => {
    afterEach(() => {
      Object.assign(deploymentModeMock, PLATFORM)
    })

    test.each([
      ['platform', PLATFORM, ['direct', 'transaction', 'session']],
      ['CLI', CLI, ['direct']],
      ['self-hosted', SELF_HOSTED, ['session', 'transaction', 'direct']],
    ])('%s exposes connectionMethod options %j', (_label, mode, expected) => {
      Object.assign(deploymentModeMock, mode)
      const { result } = renderHook(() => useConnectState({ mode: 'direct' }))
      const values = result.current.getFieldOptions('connectionMethod').map((o) => o.value)
      expect(values).toEqual(expected)
    })

    test('self-hosted overrides direct and session method descriptions', () => {
      Object.assign(deploymentModeMock, SELF_HOSTED)
      const { result } = renderHook(() => useConnectState({ mode: 'direct' }))
      const options = result.current.getFieldOptions('connectionMethod')
      expect(options.find((o) => o.value === 'direct')?.description).toBe(
        'Manually configurable for self-hosted Supabase.'
      )
      expect(options.find((o) => o.value === 'session')?.description).toBe(
        'Supavisor (default pooler for self-hosted Supabase).'
      )
    })

    test.each([
      ['platform', PLATFORM, 'direct'],
      ['CLI', CLI, 'direct'],
      ['self-hosted', SELF_HOSTED, 'session'],
    ])('setMode("direct") on %s defaults connectionMethod to %s', (_label, mode, expected) => {
      Object.assign(deploymentModeMock, mode)
      const { result } = renderHook(() => useConnectState({ mode: 'framework' }))
      act(() => {
        result.current.setMode('direct')
      })
      expect(result.current.state.connectionMethod).toBe(expected)
    })

    describe('mcp features for deployment mode', () => {
      test('self-hosted defaults and options stay within the non-platform subset', () => {
        Object.assign(deploymentModeMock, SELF_HOSTED)
        const { result } = renderHook(() => useConnectState({ mode: 'framework' }))
        act(() => {
          result.current.setMode('mcp')
        })

        const features = result.current.state.mcpFeatures
        expect(features).toEqual(
          expect.arrayContaining(['docs', 'database', 'development', 'debugging'])
        )
        expect(features).not.toContain('storage')
        expect(features).not.toContain('account')
        expect(features).not.toContain('auth')

        const options = result.current.getFieldOptions('mcpFeatures').map((o) => o.value)
        expect(options).toEqual(['docs', 'database', 'debugging', 'development'])
      })

      test('self-hosted strips unsupported features when re-entering mcp mode', () => {
        Object.assign(deploymentModeMock, SELF_HOSTED)
        const { result } = renderHook(() =>
          useConnectState({ mode: 'mcp', mcpFeatures: ['docs', 'account', 'database'] })
        )
        act(() => {
          result.current.setMode('mcp')
        })
        expect(result.current.state.mcpFeatures).toEqual(['docs', 'database'])
      })
    })
  })
})

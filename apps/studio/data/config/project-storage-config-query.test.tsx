import { waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  useIsVectorBucketsEnabled,
  type ProjectStorageConfigData,
} from './project-storage-config-query'
import type { DeploymentMode } from '@/hooks/misc/useDeploymentMode'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const { mockIsPlatform, mockUseDeploymentMode } = vi.hoisted(() => ({
  mockIsPlatform: { value: false },
  mockUseDeploymentMode: vi.fn<() => DeploymentMode>(),
}))

// `useProjectStorageConfigQuery` (same module as the hook under test) gates its
// fetch on the build-time `IS_PLATFORM` constant — mock it so the query fires in
// the platform cases.
vi.mock('@/lib/constants', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/constants')
  return {
    ...actual,
    get IS_PLATFORM() {
      return mockIsPlatform.value
    },
  }
})

vi.mock('@/hooks/misc/useDeploymentMode', () => ({
  useDeploymentMode: mockUseDeploymentMode,
}))

const createStorageConfig = (vectorBucketsEnabled: boolean): ProjectStorageConfigData =>
  ({
    capabilities: { iceberg_catalog: false, list_v2: false },
    databasePoolMode: 'transaction',
    external: { upstreamTarget: 'main' },
    features: {
      icebergCatalog: { enabled: false, maxCatalogs: 0, maxNamespaces: 0, maxTables: 0 },
      imageTransformation: { enabled: false },
      s3Protocol: { enabled: false },
      vectorBuckets: { enabled: vectorBucketsEnabled, maxBuckets: 0, maxIndexes: 0 },
    },
    fileSizeLimit: 0,
    migrationVersion: 'v1',
  }) as ProjectStorageConfigData

const deploymentMode = (overrides: Partial<DeploymentMode>): DeploymentMode => ({
  isPlatform: false,
  isCli: false,
  isSelfHosted: false,
  ...overrides,
})

describe('useIsVectorBucketsEnabled', () => {
  beforeEach(() => {
    mockIsPlatform.value = false
    mockUseDeploymentMode.mockReset()
  })

  test('platform + storage config flag enabled: true', async () => {
    mockIsPlatform.value = true
    mockUseDeploymentMode.mockReturnValue(deploymentMode({ isPlatform: true }))
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/config/storage',
      response: () => HttpResponse.json<ProjectStorageConfigData>(createStorageConfig(true)),
    })

    const { result } = customRenderHook(() => useIsVectorBucketsEnabled({ projectRef: 'default' }))

    await waitFor(() => expect(result.current).toBe(true))
  })

  test('platform + storage config flag disabled: false', async () => {
    mockIsPlatform.value = true
    mockUseDeploymentMode.mockReturnValue(deploymentMode({ isPlatform: true }))

    let configRequested = false
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/config/storage',
      response: () => {
        configRequested = true
        return HttpResponse.json<ProjectStorageConfigData>(createStorageConfig(false))
      },
    })

    const { result } = customRenderHook(() => useIsVectorBucketsEnabled({ projectRef: 'default' }))

    await waitFor(() => expect(configRequested).toBe(true))
    expect(result.current).toBe(false)
  })

  test('CLI: true regardless of the storage config flag', () => {
    // Query is disabled off-platform, so no storage config endpoint is needed.
    mockUseDeploymentMode.mockReturnValue(deploymentMode({ isCli: true }))

    const { result } = customRenderHook(() => useIsVectorBucketsEnabled({ projectRef: 'default' }))

    expect(result.current).toBe(true)
  })

  test('self-hosted: false', () => {
    mockUseDeploymentMode.mockReturnValue(deploymentMode({ isSelfHosted: true }))

    const { result } = customRenderHook(() => useIsVectorBucketsEnabled({ projectRef: 'default' }))

    expect(result.current).toBe(false)
  })
})

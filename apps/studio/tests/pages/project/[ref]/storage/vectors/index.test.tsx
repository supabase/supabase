import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { ProjectStorageConfigData } from '@/data/config/project-storage-config-query'
import { API_URL } from '@/lib/constants'
import StorageVectorsPage from '@/pages/project/[ref]/storage/vectors'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer } from '@/tests/lib/msw'

const { mockIsPlatform } = vi.hoisted(() => ({
  mockIsPlatform: { value: true },
}))

// `IS_PLATFORM` is a build-time constant, so it can't be driven over the
// network — mock it in both modules that read it (the page imports from
// `common`; the data hooks read from `@/lib/constants`). Everything else the
// page branches on comes from real queries via MSW.
vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    useParams: () => ({ ref: 'default' }),
    get IS_PLATFORM() {
      return mockIsPlatform.value
    },
  }
})

vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    get IS_PLATFORM() {
      return mockIsPlatform.value
    },
  }
})

// Stub the heavy leaf children — each fires its own queries and renders a large
// tree. We only assert which branch the page picks.
vi.mock('@/components/interfaces/Storage/VectorBuckets', () => ({
  VectorsBuckets: () => <div>vectors-buckets</div>,
}))

vi.mock('@/components/interfaces/Storage/BucketsUpgradePlan', () => ({
  BucketsUpgradePlan: ({ type }: { type: string }) => <div>buckets-upgrade-plan-{type}</div>,
}))

const mockStorageConfig = (vectorBucketsEnabled: boolean) => {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/config/storage',
    response: () =>
      HttpResponse.json<ProjectStorageConfigData>({
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
      } as ProjectStorageConfigData),
  })
}

const mockDeploymentMode = (isCli: boolean) => {
  mswServer.use(
    http.get(`${API_URL}/platform/deployment-mode`, () => HttpResponse.json({ is_cli_mode: isCli }))
  )
}

describe('StorageVectorsPage', () => {
  beforeEach(() => {
    mockIsPlatform.value = true
  })

  test('platform + not enabled: shows upgrade plan', async () => {
    mockStorageConfig(false)

    customRender(<StorageVectorsPage dehydratedState={undefined} />)

    expect(await screen.findByText('buckets-upgrade-plan-vector')).toBeInTheDocument()
    expect(screen.queryByText('vectors-buckets')).not.toBeInTheDocument()
  })

  test('platform + enabled: shows vector buckets', async () => {
    mockStorageConfig(true)

    customRender(<StorageVectorsPage dehydratedState={undefined} />)

    expect(await screen.findByText('vectors-buckets')).toBeInTheDocument()
  })

  test('CLI (non-platform, enabled): shows vector buckets, skips upgrade gate', async () => {
    mockIsPlatform.value = false
    mockDeploymentMode(true)

    customRender(<StorageVectorsPage dehydratedState={undefined} />)

    expect(await screen.findByText('vectors-buckets')).toBeInTheDocument()
  })

  test('self-hosted (non-platform): renders nothing', async () => {
    mockIsPlatform.value = false
    mockDeploymentMode(false)

    const { container } = customRender(<StorageVectorsPage dehydratedState={undefined} />)

    // `useDeploymentMode` defaults to CLI during its loading window, so the page
    // briefly renders before resolving to self-hosted — wait for it to settle.
    await waitFor(() => expect(container).toBeEmptyDOMElement())
    expect(screen.queryByText('vectors-buckets')).not.toBeInTheDocument()
  })
})

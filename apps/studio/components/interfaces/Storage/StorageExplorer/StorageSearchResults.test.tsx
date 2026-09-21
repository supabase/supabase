import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { StorageSearchResults } from './StorageSearchResults'
import type { StorageObject } from '@/data/storage/bucket-objects-list-mutation'
import { customRender as render } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const { mockTrack, mockUseStorageExplorerStateSnapshot, mockNavigateToPath } = vi.hoisted(() => ({
  mockTrack: vi.fn(),
  mockUseStorageExplorerStateSnapshot: vi.fn(),
  mockNavigateToPath: vi.fn(),
}))

vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => mockTrack }))
vi.mock('@/state/storage-explorer', () => ({
  useStorageExplorerStateSnapshot: () => mockUseStorageExplorerStateSnapshot(),
}))
vi.mock('./StorageExplorerNavigation', () => ({
  useStorageExplorerNavigation: () => ({ navigateToPath: mockNavigateToPath }),
}))

const makeFile = (name: string): StorageObject => ({
  id: `id-${name}`,
  name,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  last_accessed_at: '2024-01-01T00:00:00Z',
  metadata: { mimetype: 'image/png', size: 2048 },
})

/** Folders come back from a listing as prefixes: no id, no metadata */
const makeFolder = (name: string): StorageObject => ({
  id: null,
  name,
  created_at: null,
  updated_at: null,
  last_accessed_at: null,
  metadata: null,
})

/** Serves a bucket laid out as `{ folder: [objects] }`, keyed by the listing's path */
const mockBucket = (bucket: Record<string, StorageObject[]>) => {
  addAPIMock({
    method: 'post',
    path: '/platform/storage/:ref/buckets/:id/objects/list',
    response: async ({ request }) => {
      const { path } = (await request.json()) as { path: string }
      return HttpResponse.json(bucket[path] ?? [])
    },
  })
}

describe('StorageSearchResults', () => {
  beforeAll(() => {
    // The list virtualizes its rows, and jsdom reports every element as zero-sized, which
    // would leave it empty. Give the scroll container a viewport to render into.
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 400 })
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 640 })
  })

  afterAll(() => {
    // @ts-expect-error -- restoring jsdom's own zero-size getters
    delete HTMLElement.prototype.offsetHeight
    // @ts-expect-error -- restoring jsdom's own zero-size getters
    delete HTMLElement.prototype.offsetWidth
  })

  beforeEach(() => {
    mockTrack.mockReset()
    mockNavigateToPath.mockReset()
    mockUseStorageExplorerStateSnapshot.mockReturnValue({
      projectRef: 'test-ref',
      selectedBucket: { id: 'bucket-id', name: 'my-bucket' },
    })
  })

  it('lists matches from across the bucket with the folder each one lives in', async () => {
    mockBucket({
      '': [makeFolder('images')],
      images: [makeFile('cat.png')],
    })

    render(<StorageSearchResults searchString="cat" onClearSearch={vi.fn()} />)

    expect(screen.getByText('Searching my-bucket...')).toBeInTheDocument()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'cat.png in images' })).toBeInTheDocument()
    )
    expect(screen.getByText('1 match in my-bucket')).toBeInTheDocument()
  })

  it('opens a matching file in its own folder', async () => {
    mockBucket({
      '': [makeFolder('images')],
      images: [makeFile('cat.png')],
    })
    const onClearSearch = vi.fn()

    render(<StorageSearchResults searchString="cat" onClearSearch={onClearSearch} />)

    await userEvent.click(await screen.findByRole('button', { name: 'cat.png in images' }))

    expect(mockNavigateToPath).toHaveBeenCalledWith(['images'], { preview: 'cat.png' })
    expect(onClearSearch).toHaveBeenCalled()
    expect(mockTrack).toHaveBeenCalledWith('storage_explorer_search_result_clicked', {
      itemType: 'file',
    })
  })

  it('navigates into a matching folder', async () => {
    mockBucket({
      '': [makeFolder('archive')],
      archive: [makeFolder('invoices')],
    })

    render(<StorageSearchResults searchString="invoices" onClearSearch={vi.fn()} />)

    await userEvent.click(await screen.findByRole('button', { name: 'invoices in archive' }))

    expect(mockNavigateToPath).toHaveBeenCalledWith(['archive', 'invoices'])
    expect(mockTrack).toHaveBeenCalledWith('storage_explorer_search_result_clicked', {
      itemType: 'folder',
    })
  })

  it('offers a way out when nothing matches', async () => {
    mockBucket({ '': [makeFile('dog.png')] })
    const onClearSearch = vi.fn()

    render(<StorageSearchResults searchString="cat" onClearSearch={onClearSearch} />)

    await waitFor(() => expect(screen.getByText('No items match "cat"')).toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(onClearSearch).toHaveBeenCalled()
  })

  it('surfaces a failed search with a way to retry', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/buckets/:id/objects/list',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Bucket not found' }, { status: 500 }),
    })

    render(<StorageSearchResults searchString="cat" onClearSearch={vi.fn()} />)

    await waitFor(() => expect(screen.getByText('Failed to search my-bucket')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})

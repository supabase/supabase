import { act, renderHook, waitFor } from '@testing-library/react'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES } from '../Storage.constants'
import type { StorageItem } from '../Storage.types'
import {
  StorageExplorerNavigationProvider,
  useStorageExplorerNavigation,
} from './StorageExplorerNavigation'

const { mockUseStorageExplorerStateSnapshot, mockToastInfo } = vi.hoisted(() => ({
  mockUseStorageExplorerStateSnapshot: vi.fn(),
  mockToastInfo: vi.fn(),
}))

vi.mock('@/state/storage-explorer', () => ({
  useStorageExplorerStateSnapshot: () => mockUseStorageExplorerStateSnapshot(),
}))
vi.mock('sonner', () => ({ toast: { info: mockToastInfo } }))

function makeFolder(name: string): StorageItem {
  return {
    id: null,
    name,
    type: STORAGE_ROW_TYPES.FOLDER,
    status: STORAGE_ROW_STATUS.READY,
    metadata: null,
    isCorrupted: false,
    created_at: null,
    updated_at: null,
    last_accessed_at: null,
  }
}

function makeFile(name: string): StorageItem {
  return { ...makeFolder(name), id: name, type: STORAGE_ROW_TYPES.FILE }
}

function makeColumn(name: string, items: StorageItem[] = []) {
  return { id: name, name, path: '', status: STORAGE_ROW_STATUS.READY, items }
}

/**
 * `openedFolders` excludes the bucket root, so a store at `images/2024` has three
 * columns and two opened folders.
 */
function createSnapshot({
  openedFolders = [] as StorageItem[],
  columns = [makeColumn('my-bucket')],
  selectedFilePreview = undefined as any,
} = {}) {
  return {
    selectedBucket: { id: 'bucket-id', name: 'my-bucket' },
    columns,
    openedFolders,
    selectedFilePreview,
    fetchFoldersByPath: vi.fn().mockResolvedValue({ missingPaths: [] }),
    fetchFolderContents: vi.fn().mockResolvedValue(undefined),
    openFolder: vi.fn().mockResolvedValue(undefined),
    popColumn: vi.fn(),
    popColumnAtIndex: vi.fn(),
    popOpenedFolders: vi.fn(),
    popOpenedFoldersAtIndex: vi.fn(),
    clearSelectedItems: vi.fn(),
    setSelectedFilePreview: vi.fn(),
  }
}

/**
 * The nuqs adapter has to sit outside the provider, so the wrapper is composed here
 * rather than going through `customRenderHook` (whose `wrapper` option would replace
 * the adapter instead of nesting inside it).
 */
function renderWithProvider({
  searchParams = '',
  searchString = '',
  isBucketReady = true,
}: { searchParams?: string; searchString?: string; isBucketReady?: boolean } = {}) {
  const onUrlUpdate = vi.fn()
  const utils = renderHook(() => useStorageExplorerNavigation(), {
    wrapper: ({ children }: PropsWithChildren) => (
      <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
        <StorageExplorerNavigationProvider
          isBucketReady={isBucketReady}
          searchString={searchString}
        >
          {children}
        </StorageExplorerNavigationProvider>
      </NuqsTestingAdapter>
    ),
  })
  return { ...utils, onUrlUpdate }
}

describe('StorageExplorerNavigation', () => {
  beforeEach(() => {
    mockUseStorageExplorerStateSnapshot.mockReset()
    mockToastInfo.mockReset()
  })

  it('restores the column stack from ?path on mount', async () => {
    const snapshot = createSnapshot({ columns: [] })
    mockUseStorageExplorerStateSnapshot.mockReturnValue(snapshot)

    renderWithProvider({ searchParams: '?path=images/2024' })

    await waitFor(() => {
      expect(snapshot.fetchFoldersByPath).toHaveBeenCalledWith({
        paths: ['images', '2024'],
        searchString: '',
        showLoading: true,
      })
    })
    expect(snapshot.fetchFoldersByPath).toHaveBeenCalledTimes(1)
  })

  it('fetches the bucket root when there is no ?path', async () => {
    const snapshot = createSnapshot({ columns: [] })
    mockUseStorageExplorerStateSnapshot.mockReturnValue(snapshot)

    renderWithProvider()

    await waitFor(() => {
      expect(snapshot.fetchFoldersByPath).toHaveBeenCalledWith({
        paths: [],
        searchString: '',
        showLoading: true,
      })
    })
  })

  it('does not fetch until the bucket is ready', async () => {
    const snapshot = createSnapshot({ columns: [] })
    mockUseStorageExplorerStateSnapshot.mockReturnValue(snapshot)

    renderWithProvider({ searchParams: '?path=images', isBucketReady: false })

    await Promise.resolve()
    expect(snapshot.fetchFoldersByPath).not.toHaveBeenCalled()
  })

  it('drills down through the store without re-fetching the whole path', async () => {
    // Store and URL already agree on `images`; opening a child must not trigger a restore.
    const snapshot = createSnapshot({
      openedFolders: [makeFolder('images')],
      columns: [makeColumn('my-bucket'), makeColumn('images')],
    })
    mockUseStorageExplorerStateSnapshot.mockReturnValue(snapshot)

    const { result } = renderWithProvider({ searchParams: '?path=images' })

    await act(async () => {
      await result.current.openFolderAtIndex(1, makeFolder('2024'))
    })

    expect(snapshot.openFolder).toHaveBeenCalledTimes(1)
    expect(snapshot.openFolder).toHaveBeenCalledWith(1, expect.objectContaining({ name: '2024' }))
    expect(snapshot.fetchFoldersByPath).not.toHaveBeenCalled()
  })

  it('writes the URL when jumping to a path and lets the restore effect fetch it', async () => {
    const snapshot = createSnapshot({
      openedFolders: [makeFolder('images')],
      columns: [makeColumn('my-bucket'), makeColumn('images')],
    })
    mockUseStorageExplorerStateSnapshot.mockReturnValue(snapshot)

    const { result, onUrlUpdate } = renderWithProvider({ searchParams: '?path=images' })

    act(() => {
      result.current.navigateToPath(['archive', '2025'])
    })

    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled())
    const [update] = onUrlUpdate.mock.calls.at(-1)!
    expect(update.queryString).toContain('path=archive/2025')
    expect(update.options.history).toBe('push')
  })

  it('surfaces a stale deep link rather than silently showing an empty folder', async () => {
    const snapshot = createSnapshot({ columns: [] })
    snapshot.fetchFoldersByPath.mockResolvedValue({ missingPaths: ['2024'] })
    mockUseStorageExplorerStateSnapshot.mockReturnValue(snapshot)

    renderWithProvider({ searchParams: '?path=images/2024' })

    await waitFor(() => {
      expect(mockToastInfo).toHaveBeenCalledWith('"2024" no longer exists in this bucket')
    })
  })

  it('records an opened preview in ?file without adding a history entry', async () => {
    const snapshot = createSnapshot({
      columns: [makeColumn('my-bucket', [makeFile('a.png')])],
    })
    mockUseStorageExplorerStateSnapshot.mockReturnValue(snapshot)

    const { result, onUrlUpdate } = renderWithProvider()

    act(() => {
      result.current.setPreviewedFile({ ...makeFile('a.png'), columnIndex: 0 })
    })

    expect(snapshot.setSelectedFilePreview).toHaveBeenCalled()
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled())
    const [update] = onUrlUpdate.mock.calls.at(-1)!
    expect(update.queryString).toContain('file=a.png')
    expect(update.options.history).toBe('replace')
  })

  it('restores a previewed file from ?file once its column has loaded', async () => {
    const snapshot = createSnapshot({
      columns: [makeColumn('my-bucket', [makeFile('a.png')])],
    })
    mockUseStorageExplorerStateSnapshot.mockReturnValue(snapshot)

    renderWithProvider({ searchParams: '?file=a.png' })

    await waitFor(() => {
      expect(snapshot.setSelectedFilePreview).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'a.png', columnIndex: 0 })
      )
    })
  })

  it('refetches the bucket root when switching buckets without a path', async () => {
    // The provider is keyed per project, not per bucket, so the store can still hold
    // the previous bucket's columns.
    const snapshot = createSnapshot({ columns: [makeColumn('another-bucket')] })
    mockUseStorageExplorerStateSnapshot.mockReturnValue(snapshot)

    renderWithProvider()

    await waitFor(() => expect(snapshot.fetchFoldersByPath).toHaveBeenCalled())
  })
})

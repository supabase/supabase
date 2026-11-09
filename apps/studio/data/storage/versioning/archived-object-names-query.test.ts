import { describe, expect, it } from 'vitest'

import { toArchivedFileNames } from './archived-object-names-query'
import type { components } from '@/data/api'

type StorageObjectV2 = components['schemas']['StorageListResponseV2_Output']['objects'][number]

const makeRow = (
  name: string,
  {
    version,
    createdAt,
    archivedAt,
    isDeleteMarker = false,
  }: {
    version: string
    createdAt: string
    archivedAt?: string
    isDeleteMarker?: boolean
  }
): StorageObjectV2 => ({
  id: `id-${name}-${version}`,
  name,
  version,
  created_at: createdAt,
  updated_at: createdAt,
  last_accessed_at: createdAt,
  archived_at: archivedAt ?? null,
  is_delete_marker: isDeleteMarker,
  metadata: isDeleteMarker ? null : { size: 10, mimetype: 'image/svg+xml' },
})

/** A delete marker on top of the version it hid: what archiving a file leaves behind. */
const archivedRows = (name: string) => [
  makeRow(name, { version: 'v-marker', createdAt: '2024-02-01T00:00:00Z', isDeleteMarker: true }),
  makeRow(name, {
    version: 'v1',
    createdAt: '2024-01-01T00:00:00Z',
    archivedAt: '2024-02-01T00:00:00Z',
  }),
]

describe('toArchivedFileNames', () => {
  it('takes the leaf, since v2 returns the full key from the bucket root', () => {
    expect(toArchivedFileNames(archivedRows('folder/nested/icon-1.svg'))).toEqual(['icon-1.svg'])
  })

  it('leaves a root-level name alone', () => {
    expect(toArchivedFileNames(archivedRows('icon-1.svg'))).toEqual(['icon-1.svg'])
  })

  it('ignores a live file, which has no delete marker on top', () => {
    expect(
      toArchivedFileNames([
        makeRow('photo.png', { version: 'v1', createdAt: '2024-01-01T00:00:00Z' }),
      ])
    ).toEqual([])
  })

  it('ignores a delete marker left behind by a permanent delete', () => {
    // Nothing is retained underneath, so there is nothing to restore and the explorer does
    // not list it either. Prompting here would name a file the user cannot find anywhere.
    expect(
      toArchivedFileNames([
        makeRow('app icon-1.svg', {
          version: 'v-marker',
          createdAt: '2024-02-01T00:00:00Z',
          isDeleteMarker: true,
        }),
      ])
    ).toEqual([])
  })

  it('drops the empty folder placeholder, which is not a file anyone uploads onto', () => {
    expect(toArchivedFileNames(archivedRows('folder/.emptyFolderPlaceholder'))).toEqual([])
  })

  it('reports a leaf once even when two folders both hold it archived', () => {
    expect(
      toArchivedFileNames([...archivedRows('a/icon.svg'), ...archivedRows('b/icon.svg')])
    ).toEqual(['icon.svg'])
  })

  it('discards the trailing path when the page was cut short', () => {
    // Its rows are a fragment, and a fragment classifies wrongly either way.
    const rows = [...archivedRows('a/first.svg'), ...archivedRows('b/second.svg')]
    expect(toArchivedFileNames(rows, true)).toEqual(['first.svg'])
    expect(toArchivedFileNames(rows, false)).toEqual(['first.svg', 'second.svg'])
  })

  it('handles an absent list', () => {
    expect(toArchivedFileNames()).toEqual([])
    expect(toArchivedFileNames([])).toEqual([])
  })
})

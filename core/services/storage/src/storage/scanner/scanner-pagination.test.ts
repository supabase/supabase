import { type Mock, vi } from 'vitest'

vi.mock('@storage/events/objects/backup-object', () => ({
  BackupObjectEvent: {
    batchSend: vi.fn(),
  },
}))

import { ObjectScanner } from '@storage/scanner/scanner'
import type { Storage } from '@storage/storage'

class TestObjectScanner extends ObjectScanner {
  async collectAllS3Objects(prefix: string, before?: Date) {
    const pages = []

    for await (const page of this.listAllS3Objects(prefix, {
      before,
      signal: new AbortController().signal,
    })) {
      pages.push(...page)
    }

    return pages
  }
}

function makeScanner(params: { listS3Objects?: Mock }) {
  const storage = {
    backend: {
      list: params.listS3Objects ?? vi.fn(),
    },
    db: {},
  } as unknown as Storage

  return new TestObjectScanner(storage)
}

describe('ObjectScanner pagination regressions', () => {
  test('continues scanning S3 pages after an empty filtered page when a continuation token remains', async () => {
    const listS3Objects = vi
      .fn()
      .mockResolvedValueOnce({
        keys: [
          { name: 'old-orphan-a/v0', size: 30 },
          { name: 'old-orphan-a/v0.info', size: 1 },
        ],
        nextToken: 'page-2',
      })
      .mockResolvedValueOnce({
        keys: [],
        nextToken: 'page-3',
      })
      .mockResolvedValueOnce({
        keys: [
          { name: 'old-orphan-b/v1', size: 10 },
          { name: 'old-orphan-b/v1.info', size: 1 },
          { name: 'old-orphan-c/v2', size: 20 },
        ],
        nextToken: undefined,
      })

    const scanner = makeScanner({ listS3Objects })

    await expect(scanner.collectAllS3Objects('tenant/bucket')).resolves.toEqual([
      { name: 'old-orphan-a/v0', size: 30 },
      { name: 'old-orphan-b/v1', size: 10 },
      { name: 'old-orphan-c/v2', size: 20 },
    ])

    expect(listS3Objects).toHaveBeenCalledTimes(3)
    expect(listS3Objects.mock.calls[0][1]).toMatchObject({
      prefix: 'tenant/bucket/',
    })
    expect(listS3Objects.mock.calls[1][1]).toMatchObject({
      prefix: 'tenant/bucket/',
      nextToken: 'page-2',
    })
    expect(listS3Objects.mock.calls[2][1]).toMatchObject({
      prefix: 'tenant/bucket/',
      nextToken: 'page-3',
    })
  })
})

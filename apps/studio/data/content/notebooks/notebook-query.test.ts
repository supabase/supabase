import { describe, expect, it, vi } from 'vitest'

import { getNotebook } from './notebook-query'
import { STUB_NOTEBOOKS } from './notebooks-infinite-query'

// The stub simulates network latency via `timeout` — mock it away so this test stays fast.
vi.mock('@/lib/helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/helpers')>()
  return { ...actual, timeout: () => Promise.resolve() }
})

describe('getNotebook', () => {
  it('resolves the matching stub notebook by id', async () => {
    const [stub] = STUB_NOTEBOOKS

    const result = await getNotebook({ projectRef: 'default', id: stub.id })

    expect(result).toEqual(stub)
  })

  it('throws a 404 ResponseError when no stub notebook matches the id', async () => {
    await expect(getNotebook({ projectRef: 'default', id: 'unknown-id' })).rejects.toMatchObject({
      code: 404,
    })
  })
})

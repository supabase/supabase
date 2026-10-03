import { createConcurrencyLimiter } from '@internal/concurrency'

describe('createConcurrencyLimiter', () => {
  it.each([0, -1, 1.5, Number.NaN])('rejects invalid concurrency limit %s', (maxConcurrency) => {
    expect(() => createConcurrencyLimiter(maxConcurrency)).toThrow(
      `Concurrency limit must be a positive integer, received ${maxConcurrency}`
    )
  })

  it('starts work in a later microtask', async () => {
    const limit = createConcurrencyLimiter(1)
    const started: string[] = []

    const run = limit(async () => {
      started.push('task')
      return 'done'
    })

    expect(started).toEqual([])

    await Promise.resolve()

    expect(started).toEqual(['task'])
    await expect(run).resolves.toBe('done')
  })

  it('runs queued work up to the configured concurrency limit', async () => {
    const limit = createConcurrencyLimiter(2)
    const releaseA = Promise.withResolvers<void>()
    const releaseB = Promise.withResolvers<void>()
    const releaseC = Promise.withResolvers<void>()
    const started: string[] = []
    let active = 0
    let maxActive = 0

    const run = (id: string, release: Promise<void>) =>
      limit(async () => {
        started.push(id)
        active++
        maxActive = Math.max(maxActive, active)

        try {
          await release
          return id
        } finally {
          active--
        }
      })

    const a = run('a', releaseA.promise)
    const b = run('b', releaseB.promise)
    const c = run('c', releaseC.promise)

    await Promise.resolve()

    expect(started).toEqual(['a', 'b'])
    expect(maxActive).toBe(2)

    releaseA.resolve()
    await a
    await Promise.resolve()

    expect(started).toEqual(['a', 'b', 'c'])

    releaseB.resolve()
    releaseC.resolve()

    await expect(Promise.all([b, c])).resolves.toEqual(['b', 'c'])
    expect(maxActive).toBe(2)
  })

  it('releases a slot when work rejects', async () => {
    const limit = createConcurrencyLimiter(1)
    const error = new Error('failed')

    await expect(
      limit(async () => {
        throw error
      })
    ).rejects.toBe(error)

    await expect(limit(async () => 'recovered')).resolves.toBe('recovered')
  })
})

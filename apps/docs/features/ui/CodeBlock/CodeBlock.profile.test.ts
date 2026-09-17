import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

async function importProfile(flag?: string) {
  vi.resetModules()
  if (flag === undefined) {
    vi.stubEnv('DOCS_BUILD_PROFILE', '')
  } else {
    vi.stubEnv('DOCS_BUILD_PROFILE', flag)
  }
  return import('./CodeBlock.profile')
}

describe('code block build profiling', () => {
  let priorExitListeners: Array<unknown>

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    priorExitListeners = process.listeners('exit')
  })

  afterEach(() => {
    // Each enabled import registers its own exit handler, and resetting the
    // module registry doesn't unregister it. Without this, one test's flush
    // fires during the next one.
    for (const listener of process.listeners('exit')) {
      if (!priorExitListeners.includes(listener)) process.off('exit', listener as () => void)
    }
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  // Every ordinary build runs with the flag off, so transparency matters more
  // than anything the profiler reports.
  describe('when disabled', () => {
    it('returns the wrapped value unchanged', async () => {
      const { measureSync, measureAsync } = await importProfile()
      expect(measureSync('twoslash', 'typescript', () => 'value')).toBe('value')
      await expect(measureAsync('shiki-load', 'typescript', async () => 'value')).resolves.toBe(
        'value'
      )
    })

    it('propagates errors without swallowing them', async () => {
      const { measureSync, measureAsync } = await importProfile()
      const failure = new Error('nope')
      expect(() =>
        measureSync('twoslash', 'typescript', () => {
          throw failure
        })
      ).toThrow(failure)
      await expect(
        measureAsync('shiki-load', 'typescript', async () => {
          throw failure
        })
      ).rejects.toBe(failure)
    })

    it('registers no exit handler', async () => {
      const on = vi.spyOn(process, 'on')
      await importProfile()
      expect(on.mock.calls.filter(([event]) => event === 'exit')).toHaveLength(0)
    })
  })

  describe('when enabled', () => {
    it('still returns values and propagates errors', async () => {
      const { measureSync, measureAsync } = await importProfile('1')
      const failure = new Error('nope')

      expect(measureSync('twoslash', 'typescript', () => 'value')).toBe('value')
      await expect(measureAsync('shiki-load', 'typescript', async () => 'value')).resolves.toBe(
        'value'
      )
      expect(() =>
        measureSync('twoslash', 'typescript', () => {
          throw failure
        })
      ).toThrow(failure)
      await expect(
        measureAsync('shiki-load', 'typescript', async () => {
          throw failure
        })
      ).rejects.toBe(failure)
    })

    it('reports calls, errors, and per-language totals on exit', async () => {
      const { measureSync, measureAsync } = await importProfile('1')

      measureSync('twoslash', 'typescript', () => 'ok')
      expect(() =>
        measureSync('twoslash', 'typescript', () => {
          throw new Error('nope')
        })
      ).toThrow()
      await measureAsync('shiki-load', 'kotlin', async () => 'ok')

      process.emit('exit', 0)
      const lines = vi.mocked(console.log).mock.calls.map(([line]) => String(line))

      expect(lines[0]).toContain('twoslash calls=2')
      expect(lines[0]).toContain('errors=1')
      expect(lines[0]).toContain('shiki-load calls=1')
      expect(lines[0]).toMatch(/peakRssMb=\d+/)
      expect(lines).toContainEqual(expect.stringContaining('lang=typescript twoslash calls=2'))
      expect(lines).toContainEqual(expect.stringContaining('lang=kotlin shiki-load calls=1'))
    })
  })
})

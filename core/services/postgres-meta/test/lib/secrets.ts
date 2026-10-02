import { readFile } from 'node:fs/promises'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { getSecret } from '../../src/lib/secrets'

vi.mock('node:fs/promises', async (): Promise<typeof import('node:fs/promises')> => {
  const originalModule =
    await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises')
  const readFile = vi.fn()
  return { ...originalModule, readFile }
})

describe('getSecret', () => {
  const value = 'dummy'

  beforeEach(() => {
    // Clears env var
    vi.resetModules()
  })

  afterEach(() => {
    delete process.env.SECRET
    delete process.env.SECRET_FILE
  })

  test('loads from env', async () => {
    process.env.SECRET = value
    const res = await getSecret('SECRET')
    expect(res).toBe(value)
  })

  test('loads from file', async () => {
    process.env.SECRET_FILE = '/run/secrets/db_password'
    vi.mocked(readFile).mockResolvedValueOnce(value)
    const res = await getSecret('SECRET')
    expect(res).toBe(value)
  })

  test('defaults to empty string', async () => {
    expect(await getSecret('')).toBe('')
    expect(await getSecret('SECRET')).toBe('')
  })

  test('default on file not found', async () => {
    process.env.SECRET_FILE = '/run/secrets/db_password'
    const e: NodeJS.ErrnoException = new Error('no such file or directory')
    e.code = 'ENOENT'
    vi.mocked(readFile).mockRejectedValueOnce(e)
    const res = await getSecret('SECRET')
    expect(res).toBe('')
  })

  test('throws on permission denied', async () => {
    process.env.SECRET_FILE = '/run/secrets/db_password'
    const e: NodeJS.ErrnoException = new Error('permission denied')
    e.code = 'EACCES'
    vi.mocked(readFile).mockRejectedValueOnce(e)
    await expect(getSecret('SECRET')).rejects.toThrow()
  })
})

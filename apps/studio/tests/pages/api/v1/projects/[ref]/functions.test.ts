import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createMocks } from 'node-mocks-http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import handler from '../../../../../../pages/api/v1/projects/[ref]/functions'
import { mswServer } from '@/tests/lib/msw'

vi.mock('@/lib/constants', () => ({
  IS_PLATFORM: false,
  API_URL: 'https://api.example.com',
}))

describe('/api/v1/projects/[ref]/functions', () => {
  let rootDir: string

  beforeEach(async () => {
    // The handler does not hit the network; disable MSW so unrelated unhandled-request errors don't fire.
    mswServer.close()
    vi.unstubAllEnvs()
    rootDir = await mkdtemp(path.join(tmpdir(), 'functions-api-'))
  })

  afterEach(async () => {
    vi.unstubAllEnvs()
    await rm(rootDir, { recursive: true, force: true })
  })

  async function getFunctions() {
    const { req, res } = createMocks({ method: 'GET', query: { ref: 'default' } })
    await handler(req, res)
    return { status: res._getStatusCode(), data: JSON.parse(res._getData()) }
  }

  it('returns an empty list when EDGE_FUNCTIONS_MANAGEMENT_FOLDER is not set', async () => {
    vi.stubEnv('EDGE_FUNCTIONS_MANAGEMENT_FOLDER', '')

    await expect(getFunctions()).resolves.toEqual({ status: 200, data: [] })
  })

  it('returns an empty list when the functions folder does not exist', async () => {
    vi.stubEnv('EDGE_FUNCTIONS_MANAGEMENT_FOLDER', path.join(rootDir, 'missing'))

    await expect(getFunctions()).resolves.toEqual({ status: 200, data: [] })
  })

  it('lists the functions in the functions folder', async () => {
    await mkdir(path.join(rootDir, 'hello'))
    await writeFile(path.join(rootDir, 'hello', 'index.ts'), '')
    vi.stubEnv('EDGE_FUNCTIONS_MANAGEMENT_FOLDER', rootDir)

    const { status, data } = await getFunctions()

    expect(status).toBe(200)
    expect(data).toEqual([expect.objectContaining({ slug: 'hello', name: 'hello' })])
  })
})

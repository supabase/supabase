import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { NextApiRequest, NextApiResponse } from 'next'
import { createMocks } from 'node-mocks-http'
import { expect, it, vi } from 'vitest'

import getFunction from '@/pages/api/v1/projects/[ref]/functions/[slug]/index'
import listFunctions from '@/pages/api/v1/projects/[ref]/functions/index'

it('returns the same slug identity from repeated list and detail requests', async () => {
  const folder = await mkdtemp(path.join(tmpdir(), 'studio-functions-'))
  try {
    await mkdir(path.join(folder, 'hello'))
    await writeFile(path.join(folder, 'hello/index.ts'), 'export {}')
    vi.stubEnv('EDGE_FUNCTIONS_MANAGEMENT_FOLDER', folder)
    for (let attempt = 0; attempt < 2; attempt++) {
      const list = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET' })
      await listFunctions(list.req, list.res)
      expect(list.res.statusCode).toBe(200)
      expect(list.res._getJSONData()).toMatchObject([{ id: 'hello', slug: 'hello' }])
      const detail = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { slug: 'hello' },
      })
      await getFunction(detail.req, detail.res)
      expect(detail.res.statusCode).toBe(200)
      expect(detail.res._getJSONData()).toMatchObject({ id: 'hello', slug: 'hello' })
    }
  } finally {
    vi.unstubAllEnvs()
    await rm(folder, { recursive: true, force: true })
  }
})

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { expect, it, vi } from 'vitest'

import { Route as functionRoute } from '@/routes/api/v1/projects/$ref/functions/$slug/index'
import { Route as functionsRoute } from '@/routes/api/v1/projects/$ref/functions/index'
import { getRouteHandler } from '@/tests/lib/server-route'

it('returns the same slug identity from repeated list and detail requests', async () => {
  const folder = await mkdtemp(path.join(tmpdir(), 'studio-functions-'))
  try {
    await mkdir(path.join(folder, 'hello'))
    await writeFile(path.join(folder, 'hello/index.ts'), 'export {}')
    vi.stubEnv('EDGE_FUNCTIONS_MANAGEMENT_FOLDER', folder)
    for (let attempt = 0; attempt < 2; attempt++) {
      const list = await getRouteHandler(
        functionsRoute,
        'GET'
      )({
        request: new Request('http://localhost/api/v1/projects/default/functions'),
        params: { ref: 'default' },
      })
      expect(list.status).toBe(200)
      expect(await list.json()).toMatchObject([{ id: 'hello', slug: 'hello' }])
      const detail = await getRouteHandler(
        functionRoute,
        'GET'
      )({
        request: new Request('http://localhost/api/v1/projects/default/functions/hello'),
        params: { ref: 'default', slug: 'hello' },
      })
      expect(detail.status).toBe(200)
      expect(await detail.json()).toMatchObject({ id: 'hello', slug: 'hello' })
    }
  } finally {
    vi.unstubAllEnvs()
    await rm(folder, { recursive: true, force: true })
  }
})

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

import { getPipelinesMockResponse } from './pipelines-mock-fixtures'
import studioConfig from './vite.config'

const mockPipelinesApi: Plugin = {
  name: 'local-pipelines-mock-api',
  apply: 'serve',
  enforce: 'pre',
  configureServer(server) {
    const checkoutKey = createHash('sha256').update(server.config.root).digest('hex').slice(0, 12)
    const scenarioFile = join(tmpdir(), `studio-pipelines-mock-${checkoutKey}`)
    const getScenario = () => {
      try {
        return readFileSync(scenarioFile, 'utf8').trim()
      } catch {
        // This temporary preview runs via vite directly, outside Turbo.
        // eslint-disable-next-line turbo/no-undeclared-env-vars
        return process.env.PIPELINES_MOCK_SCENARIO ?? 'busy'
      }
    }
    server.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith('/api/platform/')) return next()
      const response = getPipelinesMockResponse(
        new Request(new URL(req.url, 'http://localhost'), { method: req.method }),
        getScenario()
      )
      if (!response) return next()
      res.statusCode = response.status
      res.setHeader('Content-Type', 'application/json')
      res.end(await response.text())
    })
  },
}

export default defineConfig(async (env) => {
  if (env.command !== 'serve') throw new Error('Pipeline fixtures are for local development only.')
  const config = await studioConfig(env)
  return {
    ...config,
    server: { ...config.server, host: '127.0.0.1' },
    define: { ...config.define, 'import.meta.env.STUDIO_PIPELINES_MOCK': 'true' },
    plugins: [mockPipelinesApi, ...(config.plugins ?? [])],
  }
})

#!/usr/bin/env node
// Local design preview only. Refresh Studio after switching scenarios.
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const scenarios = { one: 1, two: 2, small: 3, busy: 8 }
const scenario = process.argv[2]
if (!Object.hasOwn(scenarios, scenario)) {
  console.error('Usage: node apps/studio/scripts/pipelines-mock.mjs <one|two|small|busy>')
  process.exit(1)
}

const studioRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const checkoutKey = createHash('sha256').update(studioRoot).digest('hex').slice(0, 12)
writeFileSync(join(tmpdir(), `studio-pipelines-mock-${checkoutKey}`), scenario)
console.log(
  `Selected ${scenarios[scenario]} pipeline(s). Refresh http://127.0.0.1:8094/project/default/database/pipelines`
)

try {
  const response = await fetch('http://127.0.0.1:8094/api/platform/replication/regions', {
    signal: AbortSignal.timeout(2000),
  })
  const body = await response.json()
  if (!response.ok || !Array.isArray(body.regions)) throw new Error('Mock server unavailable')
} catch {
  console.log(`
The Studio mock server is not running. Start it from the repo root in another terminal:
PORT=8094 NEXT_PUBLIC_IS_PLATFORM=false pnpm --filter studio exec vite dev --config vite.pipelines-mock.config.ts --host 127.0.0.1 --port 8094 --strictPort
`)
}

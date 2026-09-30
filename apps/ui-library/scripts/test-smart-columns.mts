import block from '../registry/default/blocks/smart-columns/registry-item.json' with { type: 'json' }
import { testInstalledFunction } from './installed-function.mts'

const commands = [
  ['check', '--frozen', 'index.ts'],
  ['test', '--frozen', 'smart-columns.test.mts'],
]
// The integration test needs a disposable local Supabase database.
if (process.env.SMART_COLUMNS_TEST_DB_URL) {
  commands.push([
    'test',
    '--frozen',
    '--allow-env',
    '--allow-read=../../schemas',
    '--allow-net=127.0.0.1,localhost',
    'smart-columns.integration.mts',
  ])
}

await testInstalledFunction({
  files: block.files,
  functionName: 'smart-columns',
  tests: {
    'smart-columns.test.mts': 'smart-columns.test.mts',
    'smart-columns.integration.mts': 'smart-columns.integration.mts',
  },
  commands,
})

import '../scripts/utils/dotenv'

import { fileURLToPath } from 'node:url'
import { styleText } from 'node:util'
import { syncErrorCodes } from './error/errorSync'

async function sync(): Promise<void> {
  console.log(styleText('magenta', 'Starting sync to database...'))
  const allSyncResults = await Promise.all([syncErrorCodes()])
  if (allSyncResults.some((result) => !result.isOk)) {
    console.error(styleText('bold', styleText('red', 'Sync failed')))
    process.exit(1)
  } else {
    console.log(styleText('bold', styleText('green', 'Sync successful')))
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  sync()
}

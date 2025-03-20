/**
 * This script downloads the Deno types from the GitHub release page and saves them to the lib directory.
 * It is used to provide the Deno types to the Monaco editor in Studio for the Edge Functions AI editor.
 *
 * Deno Releases: https://github.com/denoland/deno/releases
 */

import fs from 'fs'
import path from 'path'

const DENO_VERSION = 'v1.45.0'
const DENO_TYPES_URL = `https://github.com/denoland/deno/releases/download/${DENO_VERSION}/lib.deno.d.ts`

const OUTPUT_FILE = path.join(path.dirname(__dirname), 'public', 'deno', 'lib.deno.d.ts')

const OUTPUT_VERSION_FILE = path.join(path.dirname(__dirname), 'public', 'deno', 'deno-version.txt')

const CURRENT_VERSION = fs.readFileSync(OUTPUT_VERSION_FILE, 'utf8')

if (CURRENT_VERSION === DENO_VERSION) {
  console.log(`Deno types already exist for version ${DENO_VERSION}, skipping download`)
  process.exit(0)
}

async function downloadTypes() {
  const response = await fetch(DENO_TYPES_URL)
  const data = await response.text()

  fs.writeFileSync(OUTPUT_FILE, data)

  fs.writeFileSync(OUTPUT_VERSION_FILE, DENO_VERSION)
}

downloadTypes()
  .then(() => {
    console.log('Deno types downloaded successfully')
  })
  .catch((error) => {
    console.error('Error downloading Deno types', error)
    process.exit(1)
  })

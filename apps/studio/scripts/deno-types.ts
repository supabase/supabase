/**
 * This script downloads the Deno types from the GitHub release page and saves them to the lib directory.
 * It is used to provide the Deno types to the Monaco editor in Studio for the Edge Functions AI editor.
 *
 * Deno Releases: https://github.com/denoland/deno/releases
 */

import fs from 'fs/promises'
import path from 'path'

const DENO_VERSION = 'v1.45.0'
const SUPABASE_FUNCTIONS_JS_VERSION = '2.4.4'

const DENO_TYPES_URL = `https://github.com/denoland/deno/releases/download/${DENO_VERSION}/lib.deno.d.ts`
const SUPABASE_FUNCTIONS_JS_TYPES_URL = `https://jsr.io/@supabase/functions-js/${SUPABASE_FUNCTIONS_JS_VERSION}/src/edge-runtime.d.ts`

const OUTPUT_FILE = path.join(path.dirname(__dirname), 'public', 'deno', 'lib.deno.d.ts')
const SUPABASE_FUNCTIONS_JS_OUTPUT_FILE = path.join(
  path.dirname(__dirname),
  'public',
  'deno',
  'edge-runtime.d.ts'
)
const OUTPUT_VERSION_FILE = path.join(path.dirname(__dirname), 'public', 'deno', 'deno-version.txt')
const SUPABASE_FUNCTIONS_JS_OUTPUT_VERSION_FILE = path.join(
  path.dirname(__dirname),
  'public',
  'deno',
  'supabase-functions-js-version.txt'
)

async function downloadTypes() {
  console.log('Downloading Deno types')

  try {
    const response = await fetch(DENO_TYPES_URL)
    const data = await response.text()

    await fs.writeFile(OUTPUT_FILE, data)
    await fs.writeFile(OUTPUT_VERSION_FILE, DENO_VERSION)

    console.log('Deno types downloaded successfully')
  } catch (error) {
    console.error('Error downloading Deno types', error)
    process.exit(1)
  }
}

async function downloadSupabaseFunctionsJsTypes() {
  console.log('Downloading Supabase Functions JS types')

  try {
    const response = await fetch(SUPABASE_FUNCTIONS_JS_TYPES_URL)
    const data = await response.text()

    await fs.writeFile(SUPABASE_FUNCTIONS_JS_OUTPUT_FILE, data)
    await fs.writeFile(SUPABASE_FUNCTIONS_JS_OUTPUT_VERSION_FILE, SUPABASE_FUNCTIONS_JS_VERSION)

    console.log('Supabase Functions JS types downloaded successfully')
  } catch (error) {
    console.error('Error downloading Supabase Functions JS types', error)
    process.exit(1)
  }
}

Promise.all([downloadTypes(), downloadSupabaseFunctionsJsTypes()])

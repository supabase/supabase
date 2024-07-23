import { dirname, join } from 'node:path'
import { __parseTypeSpec } from './Reference.typeSpec'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const DIR = join(dirname(fileURLToPath(import.meta.url)), 'generated')

async function run() {
  const parsed = await __parseTypeSpec()

  await mkdir(DIR, { recursive: true })
  await writeFile(
    join(DIR, 'typeSpec.json'),
    JSON.stringify(parsed, (key, value) => {
      if (key === 'methods') {
        return Object.fromEntries(value.entries())
      } else {
        return value
      }
    })
  )
}

run()

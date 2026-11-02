import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { generateFgaRequirementsSource } from './fga-requirements.mjs'

const packageDirectory = dirname(dirname(fileURLToPath(import.meta.url)))
const baseUrl = process.env.LOCAL_API_URL ?? 'http://localhost:8080'

// These URLs mirror redocly.yaml.
export const localSpecifications = [
  { name: 'api-v1', url: `${baseUrl}/api/v1-json` },
  { name: 'api-v2', url: `${baseUrl}/api/v2-json` },
  { name: 'platform', url: `${baseUrl}/api/platform-json` },
]

export async function generateFgaRequirements({
  specifications = localSpecifications,
  fetchImpl = fetch,
  writeFileImpl = writeFile,
  outputPath = join(packageDirectory, 'types', 'fga-requirements.ts'),
} = {}) {
  const parsedSpecs = await Promise.all(
    specifications.map(async ({ name, url }) => {
      let response

      try {
        response = await fetchImpl(url)
      } catch {
        throw new Error(`Could not fetch ${name} OpenAPI specification from ${url}.`)
      }

      if (!response.ok) {
        throw new Error(
          `Could not fetch ${name} OpenAPI specification from ${url}: ${response.status}.`
        )
      }

      return { name, spec: JSON.parse(await response.text()) }
    })
  )

  await writeFileImpl(outputPath, generateFgaRequirementsSource(parsedSpecs))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await generateFgaRequirements()
}

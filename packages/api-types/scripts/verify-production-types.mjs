import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const packageDirectory = dirname(dirname(fileURLToPath(import.meta.url)))
const typesDirectory = process.env.API_TYPES_DIRECTORY ?? join(packageDirectory, 'types')
const platformApiUrl =
  process.env.PLATFORM_API_OPENAPI_URL ?? 'https://api.supabase.com/api/platform-json'
const fetchTimeout = 30_000

const specifications = [
  { name: 'api-v1', url: 'https://api.supabase.com/api/v1-json' },
  { name: 'api-v2', url: 'https://api.supabase.com/api/v2-json' },
  { name: 'platform', url: platformApiUrl },
]

export async function fetchOpenApiSpecifications(
  specifications,
  { fetchImpl = fetch, writeFileImpl = writeFile, temporaryDirectory, generatedTypesDirectory }
) {
  return Promise.all(
    specifications.map(async ({ name, url }) => {
      let response

      try {
        response = await fetchImpl(url, {
          signal: AbortSignal.timeout(fetchTimeout),
        })
      } catch {
        throw new Error(`Could not fetch ${name} OpenAPI specification from ${url}.`)
      }

      if (!response.ok) {
        throw new Error(
          `Could not fetch ${name} OpenAPI specification from ${url}: ${response.status}.`
        )
      }

      await writeFileImpl(join(temporaryDirectory, `${name}.json`), await response.text())

      return `  ${name}:\n    root: ${join(temporaryDirectory, `${name}.json`)}\n    x-openapi-ts:\n      output: ${join(generatedTypesDirectory, `${name}.d.ts`)}`
    })
  )
}

export async function findMismatchedTypes(
  specifications,
  { readFileImpl = readFile, generatedTypesDirectory, typesDirectory }
) {
  const mismatches = await Promise.all(
    specifications.map(async ({ name }) => {
      const filename = `${name}.d.ts`
      const [generated, committed] = await Promise.all([
        readFileImpl(join(generatedTypesDirectory, filename), 'utf8'),
        readFileImpl(join(typesDirectory, filename), 'utf8'),
      ])

      return generated === committed ? undefined : filename
    })
  )

  return mismatches.filter((filename) => filename !== undefined)
}

export async function verifyProductionTypes() {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'api-types-'))
  const generatedTypesDirectory = join(temporaryDirectory, 'types')

  try {
    await mkdir(generatedTypesDirectory)

    const config = await fetchOpenApiSpecifications(specifications, {
      temporaryDirectory,
      generatedTypesDirectory,
    })

    await writeFile(join(temporaryDirectory, 'redocly.yaml'), `apis:\n${config.join('\n')}`)
    await run(
      'pnpm',
      [
        'exec',
        'openapi-typescript',
        '--redocly',
        join(temporaryDirectory, 'redocly.yaml'),
        '--alphabetize',
        '--default-non-nullable=false',
      ],
      { cwd: packageDirectory }
    )

    await run(
      'pnpm',
      [
        'exec',
        'prettier',
        '--write',
        ...specifications.map(({ name }) => join(generatedTypesDirectory, `${name}.d.ts`)),
      ],
      { cwd: packageDirectory }
    )

    const changedTypes = await findMismatchedTypes(specifications, {
      generatedTypesDirectory,
      typesDirectory,
    })

    if (changedTypes.length > 0) {
      throw new Error(`Committed API types do not match production: ${changedTypes.join(', ')}`)
    }
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true })
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await verifyProductionTypes()
}

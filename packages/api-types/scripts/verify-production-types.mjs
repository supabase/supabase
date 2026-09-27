import { execFile } from 'node:child_process'
import { appendFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
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

export async function reportTypeDifferences(
  filenames,
  {
    generatedTypesDirectory,
    typesDirectory,
    summaryPath = process.env.GITHUB_STEP_SUMMARY,
    log = console.log,
  }
) {
  const summary = [
    '## Production API type differences',
    '',
    'Committed types differ from production. `-` lines are committed; `+` lines are production.',
    '',
  ]

  for (const filename of filenames) {
    let diff
    try {
      const result = await run(
        'diff',
        [
          '-u',
          '--label',
          `committed/${filename}`,
          '--label',
          `production/${filename}`,
          join(typesDirectory, filename),
          join(generatedTypesDirectory, filename),
        ],
        { maxBuffer: 32 * 1024 * 1024 }
      )
      diff = result.stdout
    } catch (error) {
      if (error.code !== 1) throw error
      diff = error.stdout
    }

    log(`${filename}\n${diff}`)
    const preview = diff.slice(0, 60_000)
    const escaped = preview.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    summary.push(`### ${filename}`, '', `<pre>${escaped}</pre>`, '')
    if (preview.length < diff.length) {
      summary.push('Diff preview truncated. See the verification step logs for the full diff.', '')
    }
  }

  if (summaryPath) await appendFile(summaryPath, `${summary.join('\n')}\n`)
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

    // Prettier resolves its config from the formatted file's location. The generated files live
    // in a temporary directory outside the repository, so pass the repository config explicitly
    // or they are formatted with Prettier's defaults and never match the committed files.
    const { stdout: prettierConfigPath } = await run(
      'pnpm',
      ['exec', 'prettier', '--find-config-path', join(packageDirectory, 'package.json')],
      { cwd: packageDirectory }
    )

    await run(
      'pnpm',
      [
        'exec',
        'prettier',
        '--config',
        prettierConfigPath.trim(),
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
      await reportTypeDifferences(changedTypes, { generatedTypesDirectory, typesDirectory })
      throw new Error(`Committed API types do not match production: ${changedTypes.join(', ')}`)
    }
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true })
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await verifyProductionTypes()
}

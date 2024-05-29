import { PgProtoParser } from 'pg-proto-parser'
import fetch from 'node-fetch'
import { createWriteStream } from 'fs'
import { stat, mkdir, rm, writeFile, readFile } from 'fs/promises'
import { stripIndent } from 'common-tags'

const tag = '15-latest'
const cacheDir = '.cache'
const protoFilePath = `${cacheDir}/pg_query.proto`
const outDir = 'types/libpg-query'

await ensureCacheDir(cacheDir)
await ensureProtoFile(protoFilePath, tag)
await generateTypesFiles(protoFilePath, outDir)
await patchTypesFile(`${outDir}/types.ts`)
await generateModuleDefinition(`${outDir}/index.d.ts`)

/**
 * Creates a cache directory if it doesn't exist.
 */
async function ensureCacheDir(cacheDir: string) {
  try {
    await stat(cacheDir)
  } catch (err) {
    await mkdir(cacheDir, { recursive: true })
  }
}

/**
 * Downloads the PG parser proto file if it doesn't exist.
 */
async function ensureProtoFile(protoFilePath: string, tag: string) {
  try {
    await stat(protoFilePath)
  } catch (err) {
    const protoFile = await fetch(
      `https://raw.githubusercontent.com/pganalyze/libpg_query/${tag}/protobuf/pg_query.proto`
    )

    const fileStream = createWriteStream(protoFilePath)
    await new Promise((resolve, reject) => {
      protoFile.body.pipe(fileStream)
      protoFile.body.on('error', reject)
      fileStream.on('finish', resolve)
    })
  }
}

/**
 * Generates types for `libpg-query` using the PG parser proto file.
 *
 * Overwrites existing files.
 */
async function generateTypesFiles(protoPath: string, outDir: string) {
  try {
    await rm(outDir, { recursive: true, force: true })
  } catch (error) {
    console.error(`Error removing directory ${outDir}:`, error)
    process.exit(1)
  }

  const parser = new PgProtoParser(protoPath, {
    outDir,
    types: {
      enabled: true,
      optionalFields: true,
      filename: 'types.ts',
    },
    enums: {
      enabled: true,
      enumsAsTypeUnion: true,
      filename: 'enums.ts',
    },
  })

  parser.write()
}

/**
 * Patches the `Node` generated type in the types file
 * to be a union of wrapped objects (as is produced by the PG parser).
 */
async function patchTypesFile(filePath: string) {
  const typesFile = await readFile(filePath, 'utf8')
  const nodeInterface = typesFile.match(/^export type Node = (.*?);?$/m)

  if (!nodeInterface) {
    console.error('Generated types are not in the expected format')
    process.exit(1)
  }

  const [, typeUnion] = nodeInterface
  const types = typeUnion.split(/\s?\|\s?/)
  const newInterface = `\nexport type Node =\n${types.map((type) => `  | { ${type}: ${type} }`).join('\n')}\n`

  const modifiedTypesFile = typesFile.replace(/^export type Node = (.*?);?$/m, newInterface)

  await writeFile(filePath, modifiedTypesFile)
}

/**
 * Augments the type definition for `libpg-query` to
 * use the generated types.
 */
async function generateModuleDefinition(filePath: string) {
  const moduleDefinition = stripIndent`
    import { ParseResult } from './types'
    
    declare module 'libpg-query' {
      export * from './types'
      export function parseQuery(sql: string): Promise<ParseResult>
    }
  `

  await writeFile(filePath, moduleDefinition)
}

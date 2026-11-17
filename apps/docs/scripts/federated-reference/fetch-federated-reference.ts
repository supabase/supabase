import '../utils/dotenv'

import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  definitionFrontmatterSchema,
  type DefinitionFrontmatter,
} from '~/features/reference-beta/ReferenceBeta.schema'
import { REFERENCE_BETA_DIRECTORY } from '~/lib/docs'
import { getGitHubFileContents, octokit, OCTOKIT_RETRY_OPTIONS } from '~/lib/octokit'
import matter from 'gray-matter'
import { z } from 'zod/v4'

import type {
  FederatedReferenceRef,
  FederatedReferenceSource,
  FederatedReferenceVersion,
} from './types'

const SOURCES_DIR = join(dirname(fileURLToPath(import.meta.url)), 'sources')

/** Remote file names become local file names, so only accept plain ones. */
const DEFINITION_FILE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/

/**
 * Discovers every `FederatedReferenceSource` under `./sources`.
 */
async function loadSources(): Promise<FederatedReferenceSource[]> {
  const files = (await readdir(SOURCES_DIR)).filter((file) => /\.tsx?$/.test(file))

  return Promise.all(
    files.map(async (file) => {
      const mod = await import(join(SOURCES_DIR, file))
      return mod.default as FederatedReferenceSource
    })
  )
}

type LatestTagQueryResponse = {
  repository: {
    refs: {
      nodes: { name: string }[] | null
      pageInfo: { hasNextPage: boolean; endCursor: string | null }
    }
  }
}

const LATEST_TAG_QUERY = `
  query LatestTagQuery($owner: String!, $name: String!, $after: String) {
    repository(owner: $owner, name: $name) {
      refs(
        refPrefix: "refs/tags/",
        orderBy: { field: TAG_COMMIT_DATE, direction: DESC },
        first: 20,
        after: $after
      ) {
        nodes { name }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`

/**
 * Resolves a `latestTag` pattern to the newest matching tag name. GraphQL is
 * required since the REST API can't order tags by date.
 */
async function resolveLatestTag(
  { org, repo }: Pick<FederatedReferenceSource, 'org' | 'repo'>,
  pattern: string,
  after: string | null = null
): Promise<string> {
  const regex = new RegExp(pattern)

  const {
    repository: {
      refs: {
        nodes,
        pageInfo: { hasNextPage, endCursor },
      },
    },
  } = await octokit().graphql<LatestTagQueryResponse>(LATEST_TAG_QUERY, {
    owner: org,
    name: repo,
    after,
  })

  const tag = nodes?.find(({ name }) => regex.test(name))?.name
  if (tag) return tag
  if (hasNextPage && endCursor) return resolveLatestTag({ org, repo }, pattern, endCursor)

  throw new Error(`No tag matching ${pattern} found for ${org}/${repo}`)
}

async function resolveRef(
  source: FederatedReferenceSource,
  ref: FederatedReferenceRef
): Promise<string> {
  if ('branch' in ref) return ref.branch
  if ('tag' in ref) return ref.tag
  return resolveLatestTag(source, ref.latestTag.pattern)
}

/**
 * Lists the definition file names in the remote directory, or `undefined` when
 * the directory doesn't exist at that ref.
 */
async function listDefinitionFiles(
  source: FederatedReferenceSource,
  version: FederatedReferenceVersion,
  ref: string
): Promise<string[] | undefined> {
  try {
    const { data } = await octokit().request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner: source.org,
      repo: source.repo,
      path: version.definitionsDir,
      ref,
      request: OCTOKIT_RETRY_OPTIONS,
    })

    if (!Array.isArray(data)) {
      throw new Error(
        `${version.definitionsDir} in ${source.org}/${source.repo} is not a directory`
      )
    }

    return data
      .filter((entry) => entry.type === 'file' && entry.name.endsWith('.md'))
      .map((entry) => entry.name)
  } catch (error) {
    if ((error as { status?: number }).status === 404) return undefined
    throw error
  }
}

interface FetchedDefinition {
  file: string
  raw: string
  meta: DefinitionFrontmatter
}

/**
 * Downloads and validates every definition. Problems are collected across all
 * files so a library author sees everything that is wrong in one run.
 */
async function fetchDefinitions(
  source: FederatedReferenceSource,
  version: FederatedReferenceVersion,
  ref: string,
  files: string[]
): Promise<FetchedDefinition[]> {
  const problems: string[] = []

  const definitions = await Promise.all(
    files.map(async (file): Promise<FetchedDefinition | undefined> => {
      if (!DEFINITION_FILE.test(file)) {
        problems.push(`${file}: file names must be lowercase words separated by hyphens`)
        return undefined
      }

      const raw = await getGitHubFileContents({
        org: source.org,
        repo: source.repo,
        path: `${version.definitionsDir}/${file}`,
        branch: ref,
      })

      const result = definitionFrontmatterSchema.safeParse(matter(raw).data)
      if (!result.success) {
        problems.push(`${file}:\n${z.prettifyError(result.error)}`)
        return undefined
      }
      if (`${result.data.id}.md` !== file) {
        problems.push(`${file}: id "${result.data.id}" must match the file name`)
        return undefined
      }

      return { file, raw, meta: result.data }
    })
  )

  if (problems.length > 0) {
    throw new Error(
      `Invalid reference definitions from ${source.org}/${source.repo}@${ref}:\n\n${problems.join('\n\n')}`
    )
  }

  return definitions.filter((definition): definition is FetchedDefinition => !!definition)
}

/**
 * Replaces `<path>/definitions/` wholesale, so definitions deleted upstream
 * don't linger. Only called once every file has downloaded and validated.
 */
async function writeDefinitions(version: FederatedReferenceVersion, files: FetchedDefinition[]) {
  const dir = join(REFERENCE_BETA_DIRECTORY, version.path, 'definitions')
  await rm(dir, { recursive: true, force: true })
  await mkdir(dir, { recursive: true })
  await Promise.all(files.map(({ file, raw }) => writeFile(join(dir, file), raw)))
}

async function fetchVersion(
  source: FederatedReferenceSource,
  version: FederatedReferenceVersion
): Promise<number> {
  const label = `${source.org}/${source.repo} -> reference-beta/${version.path}`
  const ref = await resolveRef(source, version.ref)

  const files = await listDefinitionFiles(source, version, ref)
  if (files === undefined) {
    if (!version.optional) {
      throw new Error(`${version.definitionsDir} not found in ${source.org}/${source.repo}@${ref}`)
    }
    console.warn(
      `[federated-reference] ${label}: ${version.definitionsDir} not found at ${ref}, keeping existing definitions`
    )
    return 0
  }

  const definitions = await fetchDefinitions(source, version, ref, files)
  await writeDefinitions(version, definitions)
  console.log(`[federated-reference] ${label}@${ref}: ${definitions.length} definition(s)`)
  return definitions.length
}

async function fetchFederatedReference() {
  const sources = await loadSources()

  const counts = await Promise.all(
    sources.flatMap((source) => source.versions.map((version) => fetchVersion(source, version)))
  )

  const total = counts.reduce((sum, count) => sum + count, 0)
  console.log(
    `Fetched ${total} reference definition(s) across ${counts.length} version(s) into content/reference-beta/`
  )
}

fetchFederatedReference().catch((error) => {
  console.error(error)
  process.exit(1)
})

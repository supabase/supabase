import {
  GitHubDiscussionLoader,
  type GitHubDiscussionSource,
  fetchDiscussions,
} from './github-discussion'
import { MarkdownLoader, type MarkdownSource } from './markdown'
import { IntegrationLoader, type IntegrationSource, fetchPartners } from './partner-integrations'
import {
  CliReferenceLoader,
  type CliReferenceSource,
  ClientLibReferenceLoader,
  type ClientLibReferenceSource,
  OpenApiReferenceLoader,
  type OpenApiReferenceSource,
} from './reference-doc'
import { walk } from './util'

const ignoredFiles = ['pages/404.mdx']

export type SearchSource =
  | MarkdownSource
  | OpenApiReferenceSource
  | ClientLibReferenceSource
  | CliReferenceSource
  | GitHubDiscussionSource
  | IntegrationSource

/**
 * Fetches all the sources we want to index for search
 */
export async function fetchSources() {
  const openApiReferenceSource = new OpenApiReferenceLoader(
    'api',
    '/reference/api',
    { title: 'Management API Reference' },
    'spec/transforms/api_v0_openapi_deparsed.json',
    'spec/common-api-sections.json'
  ).load()

  const jsLibReferenceSource = new ClientLibReferenceLoader(
    'js-lib',
    '/reference/javascript',
    { title: 'JavaScript Reference' },
    'spec/supabase_js_v2.yml',
    'spec/common-client-libs-sections.json'
  ).load()

  const dartLibReferenceSource = new ClientLibReferenceLoader(
    'dart-lib',
    '/reference/dart',
    { title: 'Dart Reference' },
    'spec/supabase_dart_v2.yml',
    'spec/common-client-libs-sections.json'
  ).load()

  const pythonLibReferenceSource = new ClientLibReferenceLoader(
    'python-lib',
    '/reference/python',
    { title: 'Python Reference' },
    'spec/supabase_py_v2.yml',
    'spec/common-client-libs-sections.json'
  ).load()

  const cSharpLibReferenceSource = new ClientLibReferenceLoader(
    'csharp-lib',
    '/reference/csharp',
    { title: 'C# Reference' },
    'spec/supabase_csharp_v0.yml',
    'spec/common-client-libs-sections.json'
  ).load()

  const swiftLibReferenceSource = new ClientLibReferenceLoader(
    'swift-lib',
    '/reference/swift',
    { title: 'Swift Reference' },
    'spec/supabase_swift_v2.yml',
    'spec/common-client-libs-sections.json'
  ).load()

  const ktLibReferenceSource = new ClientLibReferenceLoader(
    'kt-lib',
    '/reference/kotlin',
    { title: 'Kotlin Reference' },
    'spec/supabase_kt_v1.yml',
    'spec/common-client-libs-sections.json'
  ).load()

  const cliReferenceSource = new CliReferenceLoader(
    'cli',
    '/reference/cli',
    { title: 'CLI Reference' },
    'spec/cli_v1_commands.yaml',
    'spec/common-cli-sections.json'
  ).load()

  const pagesSources = (await walk('pages'))
    .filter(({ path }) => /\.mdx?$/.test(path))
    .filter(({ path }) => !ignoredFiles.includes(path))
    .map((entry) => new MarkdownLoader('guide', entry.path).load())

  const contentSources = (await walk('content'))
    .filter(({ path }) => /\.mdx?$/.test(path))
    .filter(({ path }) => !ignoredFiles.includes(path))
    .map((entry) => new MarkdownLoader('guide', entry.path, { yaml: true }).load())

  const guideSources = [...pagesSources, ...contentSources]

  const partnerIntegrationSources = (await fetchPartners()).map((partner) =>
    new IntegrationLoader(partner.slug, partner).load()
  )

  const githubDiscussionSources = (
    await fetchDiscussions(
      'supabase',
      'supabase',
      'DIC_kwDODMpXOc4CUvEr' // 'Troubleshooting' category
    )
  ).map((discussion) => new GitHubDiscussionLoader('supabase/supabase', discussion).load())

  const sources: SearchSource[] = (
    await Promise.all([
      openApiReferenceSource,
      jsLibReferenceSource,
      dartLibReferenceSource,
      pythonLibReferenceSource,
      cSharpLibReferenceSource,
      swiftLibReferenceSource,
      ktLibReferenceSource,
      cliReferenceSource,
      ...githubDiscussionSources,
      ...partnerIntegrationSources,
      ...guideSources,
    ])
  ).flat()

  return sources
}

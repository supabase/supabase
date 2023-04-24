import { MarkdownSource } from './markdown'
import {
  CliReferenceSource,
  ClientLibReferenceSource,
  OpenApiReferenceSource,
} from './reference-doc'
import { walk } from './util'

const ignoredFiles = ['pages/404.mdx']

export type SearchSource =
  | MarkdownSource
  | OpenApiReferenceSource
  | ClientLibReferenceSource
  | CliReferenceSource

/**
 * Fetches all the sources we want to index for search
 */
export async function fetchSources() {
  const openApiReferenceSource = new OpenApiReferenceSource(
    'api',
    '/reference/api',
    { title: 'Management API Reference' },
    '../../spec/transforms/api_v0_openapi_deparsed.json',
    '../../spec/common-api-sections.json'
  )

  const jsLibReferenceSource = new ClientLibReferenceSource(
    'js-lib',
    '/reference/javascript',
    { title: 'JavaScript Reference' },
    '../../spec/supabase_js_v2.yml',
    '../../spec/common-client-libs-sections.json'
  )

  const dartLibReferenceSource = new ClientLibReferenceSource(
    'dart-lib',
    '/reference/dart',
    { title: 'Dart Reference' },
    '../../spec/supabase_dart_v1.yml',
    '../../spec/common-client-libs-sections.json'
  )

  const pythonLibReferenceSource = new ClientLibReferenceSource(
    'python-lib',
    '/reference/python',
    { title: 'Python Reference' },
    '../../spec/supabase_py_v2.yml',
    '../../spec/common-client-libs-sections.json'
  )

  const cSharpLibReferenceSource = new ClientLibReferenceSource(
    'csharp-lib',
    '/reference/csharp',
    { title: 'C# Reference' },
    '../../spec/supabase_csharp_v0.yml',
    '../../spec/common-client-libs-sections.json'
  )

  const cliReferenceSource = new CliReferenceSource(
    'cli',
    '/reference/cli',
    { title: 'CLI Reference' },
    '../../spec/cli_v1_commands.yaml',
    '../../spec/common-cli-sections.json'
  )

  const guideSources = (await walk('pages'))
    .filter(({ path }) => /\.mdx?$/.test(path))
    .filter(({ path }) => !ignoredFiles.includes(path))
    .map((entry) => new MarkdownSource('guide', entry.path))

  const sources: SearchSource[] = [
    openApiReferenceSource,
    jsLibReferenceSource,
    dartLibReferenceSource,
    pythonLibReferenceSource,
    cSharpLibReferenceSource,
    cliReferenceSource,
    ...guideSources,
  ]

  return sources
}

import { type GuideModel } from '../../../resources/guide/guideModel.js'
import { GuideModelLoader } from '../../../resources/guide/guideModelLoader.js'
import { LintWarningsGuideLoader, type LintWarningsGuideSource } from './lint-warnings-guide.js'
import { MarkdownLoader, type MarkdownSource } from './markdown.js'
import { IntegrationLoader, type IntegrationSource, fetchPartners } from './partner-integrations.js'
import {
  CliReferenceLoader,
  type CliReferenceSource,
  ClientLibReferenceLoader,
  type ClientLibReferenceSource,
  OpenApiReferenceLoader,
  type OpenApiReferenceSource,
} from './reference-doc.js'
import { fetchTroubleshootingSources, type TroubleshootingSource } from './troubleshooting.js'

export type SearchSource =
  | MarkdownSource
  | OpenApiReferenceSource
  | ClientLibReferenceSource
  | CliReferenceSource
  | TroubleshootingSource
  | IntegrationSource
  | LintWarningsGuideSource

export async function fetchGuideSources() {
  const guides = (await GuideModelLoader.allFromFs()).unwrapLeft()

  return guides.map((guide: GuideModel) => MarkdownLoader.fromGuideModel('guide', guide))
}

export async function fetchOpenApiReferenceSource() {
  return new OpenApiReferenceLoader(
    'api',
    '/reference/api',
    { title: 'Management API Reference' },
    'spec/transforms/api_v1_openapi_deparsed.json',
    'spec/common-api-sections.json'
  ).load()
}

export async function fetchJsLibReferenceSource() {
  return new ClientLibReferenceLoader(
    'js-lib',
    '/reference/javascript',
    { title: 'JavaScript Reference', language: 'JavaScript' },
    'spec/supabase_js_v2.yml',
    'spec/common-client-libs-sections.json'
  ).load()
}

export async function fetchDartLibReferenceSource() {
  return new ClientLibReferenceLoader(
    'dart-lib',
    '/reference/dart',
    { title: 'Dart Reference', language: 'Dart' },
    'spec/supabase_dart_v2.yml',
    'spec/common-client-libs-sections.json'
  ).load()
}

export async function fetchPythonLibReferenceSource() {
  return new ClientLibReferenceLoader(
    'python-lib',
    '/reference/python',
    { title: 'Python Reference', language: 'Python' },
    'spec/supabase_py_v2.yml',
    'spec/common-client-libs-sections.json'
  ).load()
}

export async function fetchCSharpLibReferenceSource() {
  return new ClientLibReferenceLoader(
    'csharp-lib',
    '/reference/csharp',
    { title: 'C# Reference', language: 'C#' },
    'spec/supabase_csharp_v0.yml',
    'spec/common-client-libs-sections.json'
  ).load()
}

export async function fetchSwiftLibReferenceSource() {
  return new ClientLibReferenceLoader(
    'swift-lib',
    '/reference/swift',
    { title: 'Swift Reference', language: 'Swift' },
    'spec/supabase_swift_v2.yml',
    'spec/common-client-libs-sections.json'
  ).load()
}

export async function fetchKtLibReferenceSource() {
  return new ClientLibReferenceLoader(
    'kt-lib',
    '/reference/kotlin',
    { title: 'Kotlin Reference', language: 'Kotlin' },
    'spec/supabase_kt_v1.yml',
    'spec/common-client-libs-sections.json'
  ).load()
}

export async function fetchCliLibReferenceSource() {
  return new CliReferenceLoader(
    'cli',
    '/reference/cli',
    { title: 'CLI Reference', platform: 'cli' },
    'spec/cli_v1_commands.yaml',
    'spec/common-cli-sections.json'
  ).load()
}

export async function fetchLintWarningsGuideSources() {
  return new LintWarningsGuideLoader(
    'guide',
    '/guides/database/database-advisors',
    'supabase',
    'splinter',
    'main',
    'docs'
  ).load()
}

/**
 * Fetches all the sources we want to index for search
 */
export async function fetchAllSources(fullIndex: boolean) {
  const guideSources = fetchGuideSources()
  const lintWarningsGuideSources = fetchLintWarningsGuideSources()
  const openApiReferenceSource = fetchOpenApiReferenceSource()
  const jsLibReferenceSource = fetchJsLibReferenceSource()
  const dartLibReferenceSource = fullIndex ? fetchDartLibReferenceSource() : []
  const pythonLibReferenceSource = fullIndex ? fetchPythonLibReferenceSource() : []
  const cSharpLibReferenceSource = fullIndex ? fetchCSharpLibReferenceSource() : []
  const swiftLibReferenceSource = fullIndex ? fetchSwiftLibReferenceSource() : []
  const ktLibReferenceSource = fullIndex ? fetchKtLibReferenceSource() : []
  const cliReferenceSource = fullIndex ? fetchCliLibReferenceSource() : []

  const partnerIntegrationSources = fullIndex
    ? fetchPartners()
        .then((partners) =>
          partners
            ? Promise.all(
                partners.map((partner) => new IntegrationLoader(partner.slug, partner).load())
              )
            : []
        )
        .then((data) => data.flat())
    : []

  // Load troubleshooting articles from local MDX files
  const troubleshootingSources = fetchTroubleshootingSources()
    .then((loaders) => Promise.all(loaders.map((loader) => loader.load())))
    .then((data) => data.flat())

  // Type assertion required because ReferenceLoader.load() returns Promise<BaseSource[]>
  // which widens the inferred union type. All concrete sources in this array are valid
  // SearchSource types (MarkdownSource, OpenApiReferenceSource, etc.).
  const sources = (
    await Promise.all([
      guideSources,
      lintWarningsGuideSources,
      openApiReferenceSource,
      jsLibReferenceSource,
      dartLibReferenceSource,
      pythonLibReferenceSource,
      cSharpLibReferenceSource,
      swiftLibReferenceSource,
      ktLibReferenceSource,
      cliReferenceSource,
      partnerIntegrationSources,
      troubleshootingSources,
    ])
  ).flat() as SearchSource[]

  return sources
}

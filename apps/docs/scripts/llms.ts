import './utils/dotenv.js'
import 'dotenv/config'

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { isFeatureEnabled } from '../../../packages/common/enabled-features/index.js'
import { getCustomContent } from '../lib/custom-content/getCustomContent.js'
import {
  fetchCliLibReferenceSource,
  fetchCSharpLibReferenceSource,
  fetchDartLibReferenceSource,
  fetchGuideSources,
  fetchJsLibReferenceSource,
  fetchKtLibReferenceSource,
  fetchPythonLibReferenceSource,
  fetchSwiftLibReferenceSource,
  type SearchSource,
} from './search/sources/index.js'

interface Source {
  title: string
  /**
   * Path relative to https://supabase.com. No leading slash
   */
  relPath: string
  fetch: () => Promise<SearchSource[]>
  enabled: boolean
}

const {
  sdkCsharp: sdkCsharpEnabled,
  sdkDart: sdkDartEnabled,
  sdkKotlin: sdkKotlinEnabled,
  sdkPython: sdkPythonEnabled,
  sdkSwift: sdkSwiftEnabled,
} = isFeatureEnabled(['sdk:csharp', 'sdk:dart', 'sdk:kotlin', 'sdk:python', 'sdk:swift'])

const { metadataTitle } = getCustomContent(['metadata:title'])

function toLink(source: Source) {
  return `[${source.title}](https://supabase.com/${source.relPath})`
}

const SOURCES: Source[] = [
  {
    title: 'Supabase Guides',
    relPath: 'llms/guides.txt',
    fetch: fetchGuideSources,
    enabled: true,
  },
  {
    title: 'Supabase Reference (JavaScript)',
    relPath: 'llms/js.txt',
    fetch: async () =>
      (await fetchJsLibReferenceSource()).filter(
        (item): item is SearchSource => item !== undefined
      ),
    enabled: true,
  },
  {
    title: 'Supabase Reference (Dart)',
    relPath: 'llms/dart.txt',
    fetch: async () =>
      (await fetchDartLibReferenceSource()).filter(
        (item): item is SearchSource => item !== undefined
      ),
    enabled: sdkDartEnabled,
  },
  {
    title: 'Supabase Reference (Swift)',
    relPath: 'llms/swift.txt',
    fetch: async () =>
      (await fetchSwiftLibReferenceSource()).filter(
        (item): item is SearchSource => item !== undefined
      ),
    enabled: sdkSwiftEnabled,
  },
  {
    title: 'Supabase Reference (Kotlin)',
    relPath: 'llms/kotlin.txt',
    fetch: async () =>
      (await fetchKtLibReferenceSource()).filter(
        (item): item is SearchSource => item !== undefined
      ),
    enabled: sdkKotlinEnabled,
  },
  {
    title: 'Supabase Reference (Python)',
    relPath: 'llms/python.txt',
    fetch: async () =>
      (await fetchPythonLibReferenceSource()).filter(
        (item): item is SearchSource => item !== undefined
      ),
    enabled: sdkPythonEnabled,
  },
  {
    title: 'Supabase Reference (C#)',
    relPath: 'llms/csharp.txt',
    fetch: async () =>
      (await fetchCSharpLibReferenceSource()).filter(
        (item): item is SearchSource => item !== undefined
      ),
    enabled: sdkCsharpEnabled,
  },
  {
    title: 'Supabase CLI Reference',
    relPath: 'llms/cli.txt',
    fetch: async () =>
      (await fetchCliLibReferenceSource()).filter(
        (item): item is SearchSource => item !== undefined
      ),
    enabled: true,
  },
]

// Product overview .txt files are hand-curated and live in apps/www/public/llms/.
// These links always point to production since llms.txt is only meaningful in prod.
const PRODUCT_OVERVIEW_LINKS = [
  '- [Supabase Overview](https://supabase.com/llms/homepage.txt)',
  '- [Supabase Database](https://supabase.com/llms/database.txt)',
  '- [Supabase Auth](https://supabase.com/llms/auth.txt)',
  '- [Supabase Storage](https://supabase.com/llms/storage.txt)',
  '- [Supabase Edge Functions](https://supabase.com/llms/edge-functions.txt)',
  '- [Supabase Realtime](https://supabase.com/llms/realtime.txt)',
  '- [Supabase Vector](https://supabase.com/llms/vector.txt)',
  '- [Supabase Pricing](https://supabase.com/llms/pricing.txt)',
].join('\n')

async function generateMainLlmsTxt() {
  const sourceLinks = SOURCES.filter((source) => source.enabled !== false)
    .map((source) => `- ${toLink(source)}`)
    .join('\n')

  const fullText = [
    `# ${metadataTitle}`,
    '',
    'For the complete documentation in a single file, see [Full Documentation](https://supabase.com/llms-full.txt).',
    '',
    '## Documentation',
    '',
    sourceLinks,
    '',
    '## Product Overview',
    '',
    PRODUCT_OVERVIEW_LINKS,
  ].join('\n')

  await fs.writeFile('public/llms.txt', fullText)
}

// Product overview .txt files live in apps/www/public/llms/, read at build time.
// Order matters: homepage first, pricing last, products alphabetical in between.
const PRODUCT_LLM_FILES = [
  'homepage.txt',
  'auth.txt',
  'database.txt',
  'edge-functions.txt',
  'realtime.txt',
  'storage.txt',
  'vector.txt',
  'pricing.txt',
]

const PRODUCT_LLMS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../apps/www/public/llms'
)

async function readProductLlmContent(): Promise<string> {
  const contents = await Promise.all(
    PRODUCT_LLM_FILES.map((file) => {
      const filePath = path.join(PRODUCT_LLMS_DIR, file)
      return fs.readFile(filePath, 'utf-8')
    })
  )
  return contents.join('\n\n---\n\n')
}

async function generateLlmsTxt() {
  try {
    await fs.mkdir('public/llms', { recursive: true })

    const enabledSources = SOURCES.filter((source) => source.enabled !== false)

    // Fetch all sources once, reuse for both per-SDK files and llms-full.txt
    const [productContent, ...fetchedSources] = await Promise.all([
      readProductLlmContent(),
      ...enabledSources.map(async (sourceDefn) => {
        const source = await sourceDefn.fetch()
        const sourceText = source
          .map((section) => {
            section.process()
            return section.extractIndexedContent()
          })
          .join('\n\n')
        return { defn: sourceDefn, text: sourceText }
      }),
    ])

    await Promise.all([
      generateMainLlmsTxt(),
      // Per-SDK files
      ...fetchedSources.map(({ defn, text }) =>
        fs.writeFile(`public/${defn.relPath}`, `${defn.title}\n\n${text}`)
      ),
      // Combined file: product overview + all docs
      fs.writeFile(
        'public/llms-full.txt',
        [
          '# Supabase',
          '',
          '## Product Overview',
          '',
          productContent,
          '',
          '---',
          '',
          '## Documentation',
          '',
          fetchedSources.map(({ defn, text }) => `# ${defn.title}\n\n${text}`).join('\n\n---\n\n'),
        ].join('\n')
      ),
    ])
  } catch (err) {
    console.error(err)
    throw err
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateLlmsTxt()
}

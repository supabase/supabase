import './utils/dotenv.js'

import 'dotenv/config'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
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
}

function toLink(source: Source) {
  return `[${source.title}](https://supabase.com/${source.relPath})`
}

const SOURCES: Source[] = [
  {
    title: 'Supabase Guides',
    relPath: 'llms/guides.txt',
    fetch: fetchGuideSources,
  },
  {
    title: 'Supabase Reference (JavaScript)',
    relPath: 'llms/js.txt',
    fetch: async () =>
      (await fetchJsLibReferenceSource()).filter(
        (item): item is SearchSource => item !== undefined
      ),
  },
  {
    title: 'Supabase Reference (Dart)',
    relPath: 'llms/dart.txt',
    fetch: async () =>
      (await fetchDartLibReferenceSource()).filter(
        (item): item is SearchSource => item !== undefined
      ),
  },
  {
    title: 'Supabase Reference (Swift)',
    relPath: 'llms/swift.txt',
    fetch: async () =>
      (await fetchSwiftLibReferenceSource()).filter(
        (item): item is SearchSource => item !== undefined
      ),
  },
  {
    title: 'Supabase Reference (Kotlin)',
    relPath: 'llms/kotlin.txt',
    fetch: async () =>
      (await fetchKtLibReferenceSource()).filter(
        (item): item is SearchSource => item !== undefined
      ),
  },
  {
    title: 'Supabase Reference (Python)',
    relPath: 'llms/python.txt',
    fetch: async () =>
      (await fetchPythonLibReferenceSource()).filter(
        (item): item is SearchSource => item !== undefined
      ),
  },
  {
    title: 'Supabase Reference (C#)',
    relPath: 'llms/csharp.txt',
    fetch: async () =>
      (await fetchCSharpLibReferenceSource()).filter(
        (item): item is SearchSource => item !== undefined
      ),
  },
  {
    title: 'Supabase CLI Reference',
    relPath: 'llms/cli.txt',
    fetch: async () =>
      (await fetchCliLibReferenceSource()).filter(
        (item): item is SearchSource => item !== undefined
      ),
  },
]

async function generateMainLlmsTxt() {
  const sourceLinks = SOURCES.map((source) => `- ${toLink(source)}`).join('\n')
  const fullText = `# Supabase Docs\n\n${sourceLinks}`
  fs.writeFile('public/llms.txt', fullText)
}

async function generateSourceLlmsTxt(sourceDefn: Source) {
  const source = await sourceDefn.fetch()
  const sourceText = source
    .map((section) => {
      section.process()
      return section.extractIndexedContent()
    })
    .join('\n\n')
  const fullText = sourceDefn.title + '\n\n' + sourceText

  fs.writeFile(`public/${sourceDefn.relPath}`, fullText)
}

async function generateLlmsTxt() {
  try {
    await fs.mkdir('public/llms', { recursive: true })
    await Promise.all([generateMainLlmsTxt(), ...SOURCES.map(generateSourceLlmsTxt)])
  } catch (err) {
    console.error(err)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateLlmsTxt()
}

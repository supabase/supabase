import 'dotenv/config'
import fs from 'node:fs/promises'

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
} from './search/sources'

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
    fetch: fetchJsLibReferenceSource,
  },
  {
    title: 'Supabase Reference (Dart)',
    relPath: 'llms/dart.txt',
    fetch: fetchDartLibReferenceSource,
  },
  {
    title: 'Supabase Reference (Swift)',
    relPath: 'llms/swift.txt',
    fetch: fetchSwiftLibReferenceSource,
  },
  {
    title: 'Supabase Reference (Kotlin)',
    relPath: 'llms/kt.txt',
    fetch: fetchKtLibReferenceSource,
  },
  {
    title: 'Supabase Reference (Python)',
    relPath: 'llms/py.txt',
    fetch: fetchPythonLibReferenceSource,
  },
  {
    title: 'Supabase Reference (C#)',
    relPath: 'llms/csharp.txt',
    fetch: fetchCSharpLibReferenceSource,
  },
  {
    title: 'Supabase Reference (CLI)',
    relPath: 'llms/cli.txt',
    fetch: fetchCliLibReferenceSource,
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

if (require.main === module) {
  generateLlmsTxt()
}

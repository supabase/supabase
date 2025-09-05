import './utils/dotenv.js'

import 'dotenv/config'
import fs from 'node:fs/promises'
import {
  fetchCliLibReferenceSource,
  fetchCSharpLibReferenceSource,
  fetchDartLibReferenceSource,
  fetchGuideSources,
  fetchGuidesForCategory,
  getGuideCategories,
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

// Dynamic function to generate guide sources
async function generateGuideSources(): Promise<Source[]> {
  const categories = await getGuideCategories()
  
  const guideSources: Source[] = [
    // Keep the main guides.txt for backward compatibility
    {
      title: 'Supabase Guides (All)',
      relPath: 'llms/guides.txt',
      fetch: fetchGuideSources,
    },
    // Add category-specific sources
    ...categories.map(category => ({
      title: category.title,
      relPath: `${category.urlPath}/llms.txt`,
      fetch: () => fetchGuidesForCategory(category.path),
    }))
  ]
  
  return guideSources
}

const REFERENCE_SOURCES: Source[] = [
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

async function generateMainLlmsTxt(allSources: Source[]) {
  const sourceLinks = allSources.map((source) => `- ${toLink(source)}`).join('\n')
  const fullText = `# Supabase Docs\n\n${sourceLinks}`
  await fs.writeFile('public/llms.txt', fullText)
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

  // Ensure directory exists
  const dirPath = `public/${sourceDefn.relPath}`.split('/').slice(0, -1).join('/')
  await fs.mkdir(dirPath, { recursive: true })
  
  await fs.writeFile(`public/${sourceDefn.relPath}`, fullText)
}

async function generateLlmsTxt() {
  try {
    await fs.mkdir('public/llms', { recursive: true })
    
    // Generate guide sources dynamically
    const guideSources = await generateGuideSources()
    const allSources = [...guideSources, ...REFERENCE_SOURCES]
    
    await Promise.all([
      generateMainLlmsTxt(allSources),
      ...allSources.map(generateSourceLlmsTxt)
    ])
  } catch (err) {
    console.error(err)
  }
}

// Run the function when this script is executed directly
generateLlmsTxt()

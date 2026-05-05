import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join, relative } from 'path'
import { fileURLToPath } from 'url'

import type { SpecCategory, SpecConfig } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ---------------------------------------------------------------------------
// Folder discovery
// ---------------------------------------------------------------------------

/**
 * Recursively finds all folders under `baseDir` that directly contain at least
 * one .json file other than config.json. These are treated as spec source folders.
 */
function findSpecFolders(baseDir: string): string[] {
  const result: string[] = []
  function walk(dir: string) {
    const entries = readdirSync(dir, { withFileTypes: true })
    const hasSource = entries.some(
      (e) => e.isFile() && e.name.endsWith('.json') && e.name !== 'config.json'
    )
    if (hasSource) result.push(dir)
    for (const e of entries) {
      if (e.isDirectory()) walk(join(dir, e.name))
    }
  }
  walk(baseDir)
  return result
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeMdxProse(text: string): string {
  // Escape { and } outside code blocks/spans so MDX doesn't treat them as JSX.
  // Match fenced code blocks first (```...```), then inline code (`...`), leave both untouched.
  return text.replace(/(```[\s\S]*?```|`[^`]+`)|([{}])/g, (_, code, brace) =>
    code ? code : brace === '{' ? '\\{' : '\\}'
  )
}

function prop(value: unknown): string {
  return `{${JSON.stringify(value)}}`
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ---------------------------------------------------------------------------
// Partial helpers
// ---------------------------------------------------------------------------

/** Extracts h2 heading text from markdown content. */
function scanPartialH2s(content: string): string[] {
  return content.split('\n').flatMap((line) => {
    const m = line.match(/^##\s+(.+)$/)
    return m ? [m[1].trim()] : []
  })
}

/**
 * Replaces `## Heading` lines in a partial with the `## Text [#id]` notation
 * so they get proper stable anchors. prefix is prepended to the slug.
 */
function processPartialForMdx(content: string, prefix?: string): string {
  return content.replace(/^##\s+(.+)$/gm, (_, text) => {
    const t = text.trim()
    const slug = prefix ? `${prefix}-${toSlug(t)}` : toSlug(t)
    return `## ${t} [#${slug}]`
  })
}

// ---------------------------------------------------------------------------
// Sections builder
// ---------------------------------------------------------------------------

function buildSections(categories: SpecCategory[], specDir: string): object[] {
  // Introduction partial h2s become top-level nav items
  const introPath = join(specDir, 'introduction.partial.mdx')
  const introItems = existsSync(introPath)
    ? scanPartialH2s(readFileSync(introPath, 'utf-8')).map((h2) => ({
        id: toSlug(h2),
        slug: toSlug(h2),
        type: 'markdown',
        title: h2,
      }))
    : []

  const categoryItems = categories.map(({ category, definitions }) => {
    const catSlug = toSlug(category)
    const partialPath = join(specDir, `${catSlug}.partial.mdx`)
    const partialH2Items = existsSync(partialPath)
      ? scanPartialH2s(readFileSync(partialPath, 'utf-8')).map((h2) => ({
          id: `${catSlug}-${toSlug(h2)}`,
          slug: `${catSlug}-${toSlug(h2)}`,
          type: 'markdown',
          title: h2,
        }))
      : []

    return {
      id: catSlug,
      slug: catSlug,
      type: 'category',
      title: category,
      items: [
        ...partialH2Items,
        ...definitions.map((def) => ({
          id: `${catSlug}-${toSlug(def.name)}`,
          slug: `${catSlug}-${toSlug(def.name)}`,
          type: 'function',
          title: def.name,
        })),
      ],
    }
  })

  return [...introItems, ...categoryItems]
}

// ---------------------------------------------------------------------------
// MDX builder
// ---------------------------------------------------------------------------

let exampleCounter = 0

function generateExamplesBlock(examples: any[]): string[] {
  if (!examples?.length) return []

  const lines: string[] = []
  lines.push(`<h3 className="mb-3 text-base text-foreground">Examples</h3>`)
  lines.push(`<Tabs`)
  lines.push(`  scrollable`)
  lines.push(`  type="rounded-pills"`)
  lines.push(`>`)

  for (const ex of examples) {
    const id = `ex-${++exampleCounter}`
    const label = ex.title ?? `Example ${exampleCounter}`

    lines.push(``)
    lines.push(`  <TabPanel id="${id}" label="${label}">`)
    lines.push(``)

    if (ex.code) {
      lines.push('```ts')
      lines.push(ex.code)
      lines.push('```')
    }

    if (ex.sql) {
      lines.push(``)
      lines.push(
        `<CollapsibleDetails title="Data source" content=${prop('```sql\n' + ex.sql + '\n```')} />`
      )
      lines.push(``)
    }

    if (ex.response) {
      lines.push(``)
      lines.push(
        `<div className="mt-4"><CollapsibleDetails title="Response" content=${prop('```json\n' + ex.response + '\n```')} /></div>`
      )
      lines.push(``)
    }

    if (ex.notes) {
      lines.push(``)
      lines.push(
        `<div className="mt-4"><CollapsibleDetails title="Notes" content=${prop(ex.notes)} /></div>`
      )
      lines.push(``)
    }

    lines.push(``)
    lines.push(`  </TabPanel>`)
  }

  lines.push(``)
  lines.push(`</Tabs>`)
  lines.push(``)

  return lines
}

function generateMdx(categories: SpecCategory[], config: SpecConfig, specDir: string): string {
  const fmVal = (v: string) => `"${v.replace(/"/g, '\\"')}"`
  const frontmatter = [
    '---',
    `title: ${fmVal(config.title ?? 'Reference')}`,
    ...(config.subtitle ? [`subtitle: ${fmVal(config.subtitle as string)}`] : []),
    ...(config.referenceLink ? [`referenceLink: ${fmVal(config.referenceLink as string)}`] : []),
    ...(config.referenceLinkLabel
      ? [`referenceLinkLabel: ${fmVal(config.referenceLinkLabel as string)}`]
      : []),
    '---',
    '',
    '',
  ]
  const lines: string[] = frontmatter

  // Insert optional introduction partial immediately after frontmatter
  const introParthialPath = join(specDir, 'introduction.partial.mdx')
  if (existsSync(introParthialPath)) {
    lines.push(processPartialForMdx(readFileSync(introParthialPath, 'utf-8').trimEnd()), '')
  }

  for (let i = 0; i < categories.length; i++) {
    const { category, definitions } = categories[i]
    const catSlug = toSlug(category)

    if (i > 0) {
      lines.push('', '<hr />', '')
    }

    lines.push(`## ${category.trim()} [#${catSlug}]`, '')

    // Insert optional partial: <specDir>/<category-slug>.partial.mdx
    const partialPath = join(specDir, `${catSlug}.partial.mdx`)
    if (existsSync(partialPath)) {
      lines.push(processPartialForMdx(readFileSync(partialPath, 'utf-8').trimEnd(), catSlug), '')
    }

    for (let j = 0; j < definitions.length; j++) {
      const def = definitions[j]
      const isLastInCategory = j === definitions.length - 1
      const defSlug = `${catSlug}-${toSlug(def.name)}`

      lines.push(`### ${def.name} [#${defSlug}]`, '')

      if (def.description) {
        lines.push(escapeMdxProse(def.description), '')
      }

      if (def.remarks?.length) {
        for (const remark of def.remarks) {
          lines.push(escapeMdxProse(remark), '')
        }
      }

      if (def.parameters?.length) {
        lines.push(`<RefDefinitionParams parameters=${prop(def.parameters)} />`, '')
      }

      if (def.returnType) {
        lines.push(`<RefDefinitionReturnType returnType=${prop(def.returnType)} />`, '')
      }

      if (def.examples?.length) {
        lines.push(...generateExamplesBlock(def.examples))
        if (!isLastInCategory) {
          lines.push('', '<hr />', '')
        }
      }
    }
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Main: discover and process all spec folders
// ---------------------------------------------------------------------------

const specRefDir = join(__dirname, '../../spec/reference')
const contentRefDir = join(__dirname, '../../content/reference')

const specFolders = findSpecFolders(specRefDir)

if (specFolders.length === 0) {
  console.warn(`No spec folders found under ${specRefDir}`)
  process.exit(0)
}

for (const specDir of specFolders) {
  exampleCounter = 0 // reset per spec so IDs don't bleed across files

  // Read config to determine the language processor to use
  let rawConfig: SpecConfig = {}
  try {
    rawConfig = JSON.parse(readFileSync(join(specDir, 'config.json'), 'utf-8'))
  } catch {
    // config.json is optional
  }

  const language = (rawConfig.language as string) ?? 'typescript'
  // Support both compiled (.js) and tsx-run (.ts) environments
  const processorPathJs = join(__dirname, `languages/${language}.js`)
  const processorPathTs = join(__dirname, `languages/${language}.ts`)
  const processorPath = existsSync(processorPathJs) ? processorPathJs : processorPathTs

  if (!existsSync(processorPath)) {
    const rel = relative(specRefDir, specDir)
    console.error(
      `[${rel}] No language processor found for "${language}" (expected ${processorPathJs})`
    )
    continue
  }

  // Dynamic import so each language can have its own processing logic
  const processor = await import(processorPath)
  const { categories, config } = processor.processSpec(specDir)

  // Mirror the folder path: spec/reference/<rel> → content/reference/<rel>
  const rel = relative(specRefDir, specDir)
  const outDir = join(contentRefDir, rel)
  mkdirSync(outDir, { recursive: true })

  // Write MDX
  const mdx = generateMdx(categories, config, specDir)
  const mdxPath = join(outDir, 'index.mdx')
  writeFileSync(mdxPath, mdx)

  // Write data.json: sections + config merged into one file
  const data = { ...config, sections: buildSections(categories, specDir) }
  const dataPath = join(outDir, 'data.json')
  writeFileSync(dataPath, JSON.stringify(data, null, 2))

  console.log(`[${rel}] MDX → ${mdxPath}`)
  console.log(`[${rel}] data → ${dataPath}`)
  console.log(
    `[${rel}] ${categories.length} categories, ${categories.flatMap((c: SpecCategory) => c.definitions).length} definitions`
  )
}

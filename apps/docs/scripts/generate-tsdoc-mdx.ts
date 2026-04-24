import { mkdirSync, readdirSync, writeFileSync } from 'fs'
import { join, dirname, relative } from 'path'
import { fileURLToPath } from 'url'
import { processSpec, type SpecCategory, type SpecConfig } from './process-tsdoc.js'

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
// Sections builder
// ---------------------------------------------------------------------------

function buildSections(categories: SpecCategory[]): object[] {
  return categories.map(({ category, definitions }) => ({
    id: toSlug(category),
    type: 'category',
    title: category,
    items: definitions.map((def) => ({
      id: def.name,
      type: 'function',
      title: def.name,
      slug: def.name,
    })),
  }))
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

function generateMdx(categories: SpecCategory[], config: SpecConfig): string {
  const fmVal = (v: string) => `"${v.replace(/"/g, '\\"')}"`
  const frontmatter = [
    '---',
    `title: ${fmVal(config.title ?? 'Reference')}`,
    ...(config.subtitle ? [`subtitle: ${fmVal(config.subtitle)}`] : []),
    ...(config.referenceLink ? [`referenceLink: ${fmVal(config.referenceLink)}`] : []),
    ...(config.referenceLinkLabel
      ? [`referenceLinkLabel: ${fmVal(config.referenceLinkLabel)}`]
      : []),
    '---',
    '',
    '',
  ]
  const lines: string[] = frontmatter

  for (let i = 0; i < categories.length; i++) {
    const { category, definitions } = categories[i]

    if (i > 0) {
      lines.push('', '<hr />', '')
    }

    lines.push(`## ${category}`, '')

    for (let j = 0; j < definitions.length; j++) {
      const def = definitions[j]
      const isLastInCategory = j === definitions.length - 1

      lines.push(`### ${def.name}`, '')

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

const specRefDir = join(__dirname, '../spec/reference')
const contentRefDir = join(__dirname, '../content/reference')

const specFolders = findSpecFolders(specRefDir)

if (specFolders.length === 0) {
  console.warn(`No spec folders found under ${specRefDir}`)
  process.exit(0)
}

for (const specDir of specFolders) {
  exampleCounter = 0 // reset per spec so IDs don't bleed across files

  const { categories, config } = processSpec(specDir)

  // Mirror the folder path: spec/reference/<rel> → content/reference/<rel>
  const rel = relative(specRefDir, specDir)
  const outDir = join(contentRefDir, rel)
  mkdirSync(outDir, { recursive: true })

  // Write MDX
  const mdx = generateMdx(categories, config)
  const mdxPath = join(outDir, 'index.mdx')
  writeFileSync(mdxPath, mdx)

  // Write sections
  const sections = buildSections(categories)
  const sectionsPath = join(outDir, 'sections.json')
  writeFileSync(sectionsPath, JSON.stringify(sections, null, 2))

  console.log(`[${rel}] MDX → ${mdxPath}`)
  console.log(`[${rel}] sections → ${sectionsPath}`)
  console.log(
    `[${rel}] ${categories.length} categories, ${categories.flatMap((c) => c.definitions).length} definitions`
  )
}

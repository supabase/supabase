import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { processSpec } from './process-tsdoc.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const CONFIG_PATH = join(__dirname, '../spec/enrichments/tsdoc_v2/config.json')
const config: {
  title?: string
  subtitle?: string
  referenceLink?: string
  referenceLinkLabel?: string
} = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'))

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

function generateMdx(categories: ReturnType<typeof processSpec>): string {
  const fmVal = (v: string) => `"${v.replace(/"/g, '\\"')}"`
  const frontmatter = [
    '---',
    `title: ${fmVal(config.title ?? 'Reference')}`,
    ...(config.subtitle ? [`subtitle: ${fmVal(config.subtitle)}`] : []),
    ...(config.referenceLink ? [`referenceLink: ${fmVal(config.referenceLink)}`] : []),
    ...(config.referenceLinkLabel ? [`referenceLinkLabel: ${fmVal(config.referenceLinkLabel)}`] : []),
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

const processed = processSpec()
const mdx = generateMdx(processed)

const outPath = join(__dirname, '../content/reference/javascript.mdx')
mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, mdx)
console.log(`MDX written to ${outPath}`)
console.log(
  `${processed.length} categories, ${processed.flatMap((c) => c.definitions).length} definitions`
)

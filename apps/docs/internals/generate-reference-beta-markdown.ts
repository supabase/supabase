import fs from 'node:fs/promises'
import path from 'node:path'
import { REFERENCE_BETA_DIRECTORY } from '~/lib/docs'
import type { Content, ListItem, PhrasingContent, Root, Text } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'

import {
  getDefinitions,
  getLibrary,
  getLibrarySlugs,
  referenceBetaHref,
  type Definition,
  type Library,
} from '../features/reference-beta/ReferenceBeta.utils'
import { addBaseUrlPrefix, withDocsBasePath } from './internal-links'
import { applySchema, parseMdx, serializeMdx, type ComponentSchema } from './markdown-ast'
import { Admonition } from './markdown-schema/Admonition'
import { Image } from './markdown-schema/Image'
import { Link } from './markdown-schema/Link'
import { TabPanel } from './markdown-schema/TabPanel'

/**
 * Markdown variants of the reference-beta pages, under
 * public/markdown/reference-beta/. Every file sits at its page URL plus `.md`:
 *
 *   <library>.md                   rewritten from <library>/index.md: see `renderIndex`
 *   <library>/<id>.md              copied as is from <library>/definitions/<id>.md
 *
 * so `server/v0/index.md` becomes `server/v0.md`, next to `server/<id>.md`.
 */

const OUTPUT_ROOT = path.join(process.cwd(), 'public', 'markdown', 'reference-beta')

// Components an index.md may use. Any other component is unwrapped.
const SCHEMA: ComponentSchema = { Admonition, Image, Link, TabPanel }

const text = (value: string): Text => ({ type: 'text', value })

// Summaries and descriptions are written as inline Markdown (e.g. `code`), so
// parse them rather than treat them as literal text, which would escape it.
const inline = (markdown: string) =>
  (fromMarkdown(markdown).children[0] as { children: PhrasingContent[] }).children

function definitionItem(library: Library, { meta }: Definition): ListItem {
  const url = withDocsBasePath(`${referenceBetaHref(library.slug, meta.id)}.md`)
  return {
    type: 'listItem',
    children: [
      {
        type: 'paragraph',
        children: [
          { type: 'link', url, children: [text(meta.title)] },
          ...(meta.summary ? [text(': '), ...inline(meta.summary)] : []),
        ],
      },
    ],
  }
}

/**
 * Drops the frontmatter and leads with its title (h1), package and
 * description, then the introduction, then a link to every definition's
 * markdown. Other frontmatter properties are ignored.
 */
async function renderIndex(library: Library, definitions: Definition[]): Promise<string> {
  const { title, package: pkg, description } = library.meta

  const body = parseMdx(library.content)
  body.children.push(
    { type: 'heading', depth: 2, children: [text('Definitions')] },
    { type: 'list', ordered: false, children: definitions.map((d) => definitionItem(library, d)) }
  )
  addBaseUrlPrefix(body)
  applySchema(body, SCHEMA)

  const header: Content[] = [{ type: 'heading', depth: 1, children: [text(title)] }]
  if (pkg) header.push({ type: 'paragraph', children: [text(pkg)] })
  if (description) header.push({ type: 'paragraph', children: inline(description) })

  const root: Root = { type: 'root', children: [...header, ...body.children] as Root['children'] }
  return serializeMdx(root)
}

async function generateLibrary(library: Library) {
  const definitions = await getDefinitions(library)
  const outDir = path.join(OUTPUT_ROOT, ...library.slug)
  const indexFile = `${outDir}.md`

  await fs.mkdir(outDir, { recursive: true })
  await fs.writeFile(indexFile, await renderIndex(library, definitions))

  await Promise.all(
    definitions.map(({ meta }) => {
      const file = `${meta.id}.md`
      return fs.copyFile(
        path.join(REFERENCE_BETA_DIRECTORY, ...library.slug, 'definitions', file),
        path.join(outDir, file)
      )
    })
  )

  return definitions.length
}

async function generate() {
  // Start clean so a definition removed upstream doesn't linger.
  await fs.rm(OUTPUT_ROOT, { recursive: true, force: true })

  const slugs = await getLibrarySlugs()
  let definitions = 0

  for (const slug of slugs) {
    try {
      definitions += await generateLibrary((await getLibrary(slug))!)
    } catch (err) {
      throw new Error(
        `Failed to process reference-beta/${slug.join('/')}: ${err instanceof Error ? err.message : err}`,
        { cause: err }
      )
    }
  }

  console.log(
    `Generated ${slugs.length} library and ${definitions} definition markdown files under public/markdown/reference-beta/`
  )
}

generate().catch((error) => {
  console.error(error)
  process.exit(1)
})

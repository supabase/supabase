// @ts-check

/**
 * Copies MDX files from the `pages` directory to the `content` directory,
 * replacing frontmatter in `meta` with YAML frontmatter.
 */

import { parse } from 'acorn'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxFromMarkdown } from 'mdast-util-mdx'
import { mdxjs } from 'micromark-extension-mdxjs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = join(__dirname, '../..')
const PAGES_DIR = join(ROOT_DIR, 'pages/guides')
const CONTENT_DIR = join(ROOT_DIR, 'content/guides')

function convertToYaml(properties) {
  let result = '---\n'

  for (const property of properties) {
    const key = property.key.name
    const value = property.value.value
    result += `${key}: "${value}"\n`
  }

  result += '---\n\n'
  return result
}

async function main() {
  try {
    const origDirContents = await readdir(PAGES_DIR, { recursive: true })
    const origMdxFiles = origDirContents.filter((filename) => extname(filename) === '.mdx')

    await Promise.all(
      origMdxFiles.map(async (filename) => {
        const content = await readFile(join(PAGES_DIR, filename), 'utf-8')

        const mdxTree = fromMarkdown(content, {
          extensions: [mdxjs()],
          mdastExtensions: [mdxFromMarkdown()],
        })

        const meta = mdxTree.children.find(
          (node) => node.type === 'mdxjsEsm' && node.value.trim().startsWith('export const meta')
        )
        if (!meta) return

        const linesIncl = [meta.position.start.line, meta.position.end.line]

        const parsedMeta = parse(meta.value, { ecmaVersion: 2020, sourceType: 'module' })
        const yamlString = convertToYaml(
          parsedMeta.body[0].declaration.declarations[0].init.properties
        )

        const lines = content.split('\n')
        lines.splice(
          meta.position.start.line - 1,
          meta.position.end.line - meta.position.start.line + 1
        )
        const contentWithoutMeta = lines.join('\n')
        const contentWithFrontmatter = yamlString + contentWithoutMeta

        const destinationPath = join(CONTENT_DIR, filename)
        await mkdir(dirname(destinationPath), { recursive: true })
        writeFile(destinationPath, contentWithFrontmatter)
      })
    )
  } catch (err) {
    console.error(err)
  }
}

main()

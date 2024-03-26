// @ts-check

/**
 * Copies MDX files from the `pages` directory to the `content` directory,
 * replacing frontmatter in `meta` with YAML frontmatter.
 *
 * Also deletes import and export statements.
 */

let SUB_DIR = 'self-hosting'

import { parse } from 'acorn'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxFromMarkdown } from 'mdast-util-mdx'
import { mdxjs } from 'micromark-extension-mdxjs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = join(__dirname, '../..')
let PAGES_DIR = join(ROOT_DIR, 'pages/guides')
let CONTENT_DIR = join(ROOT_DIR, 'content/guides')

if (SUB_DIR) {
  PAGES_DIR = join(PAGES_DIR, SUB_DIR)
  CONTENT_DIR = join(CONTENT_DIR, SUB_DIR)
}

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

        let yamlString = ''
        if (meta) {
          // @ts-ignore
          const parsedMeta = parse(meta.value, { ecmaVersion: 2020, sourceType: 'module' })
          yamlString = convertToYaml(
            // @ts-ignore
            parsedMeta.body[0].declaration.declarations[0].init.properties
          )
        }

        const importStatements = mdxTree.children.filter(
          (node) => node.type === 'mdxjsEsm' && node.value.trim().match(/^import \w+ from/)
        )

        const exportStatements = mdxTree.children.filter(
          (node) =>
            node.type === 'mdxjsEsm' &&
            (node.value.trim().match(/^export const (?!meta)/) ||
              node.value.trim().startsWith('export default'))
        )

        const positions = [meta, ...importStatements, ...exportStatements]
          // @ts-ignore
          .map(({ position }) => [position.start.line, position.end.line])
          // splicing them out in reverse order means we don't have to worry about line numbers shifting
          .sort((a, b) => b[0] - a[0])

        let index = 0
        while (index < positions.length - 1) {
          const overlapsNext = positions[index][0] <= positions[index + 1][1]
          if (overlapsNext) {
            positions[index][0] = positions[index + 1][0]
            positions.splice(index + 1, 1)
          } else {
            index++
          }
        }

        const lines = content.split('\n')
        for (const position of positions) {
          lines.splice(position[0] - 1, position[1] - position[0] + 1)
        }
        const splicedLines = lines.join('\n')
        const splicedWithFrontmatter = yamlString + splicedLines

        const destinationPath = join(CONTENT_DIR, filename)
        await mkdir(dirname(destinationPath), { recursive: true })
        writeFile(destinationPath, splicedWithFrontmatter)
      })
    )
  } catch (err) {
    console.error(err)
  }
}

main()

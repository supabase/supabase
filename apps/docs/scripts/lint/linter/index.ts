import { readFile, writeFile } from 'fs/promises'
import { commentMarker } from 'mdast-comment-marker'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxFromMarkdown } from 'mdast-util-mdx'
import { mdxjs } from 'micromark-extension-mdxjs'
import { extname } from 'path'
import { visit } from 'unist-util-visit'
import { LintError } from '../rules/rules'
import { walk } from '../../utils/walk'
import { testIsContent } from '../utils/mdast'
import { RulesConfig } from '../rules'
import { FileIgnores } from '../ignore'

interface FileErrors {
  file: string
  errors: LintError[]
}

export async function lint(
  target: string,
  options: { autoFix: boolean; isDirectory: boolean; rulesConfig: RulesConfig }
) {
  const pages = options.isDirectory ? await walk(target ?? 'pages') : [{ path: target }]
  const errors: FileErrors[] = []

  const result = pages.map(async (page) => {
    if (extname(page.path) !== '.mdx') {
      return
    }

    const contents = await readFile(page.path, 'utf8')
    const localErrors: LintError[] = []
    const localIgnores = new FileIgnores()

    const mdxTree = fromMarkdown(contents, {
      extensions: [mdxjs()],
      mdastExtensions: [mdxFromMarkdown()],
    })

    visit(mdxTree, function collectIgnores(node) {
      const info = commentMarker(node)
      if (!info) return
      if (info.name !== 'prose-lint') return

      if ('disable-all' in info.parameters) {
        for (const parameter in info.parameters) {
          if (parameter === 'disable-all') continue
          localIgnores.addGlobalIgnore(parameter)
        }
        return
      }

      if ('disable' in info.parameters) {
        for (const parameter in info.parameters) {
          if (parameter === 'disable') continue
          localIgnores.startRangeIgnore(parameter, node.position.start.line)
        }
        return
      }

      if ('enable' in info.parameters) {
        for (const parameter in info.parameters) {
          if (parameter === 'enable') continue
          localIgnores.endRangeIgnore(parameter, node.position.end.line)
        }
      }
    })

    visit(mdxTree, testIsContent, function lintNodes(node, index, parent) {
      if (options.rulesConfig.byType[node.type]) {
        options.rulesConfig.byType[node.type].forEach((rule) => {
          const result = rule.runRule(node, index, parent, page.path)
          if (result.length) {
            localErrors.push(...result)
          }
        })
      }
    })

    if (localErrors.length) {
      errors.push({
        file: page.path,
        errors: localErrors,
      })
    }

    if (options.autoFix) {
      let newContents = contents.split('\n')

      localErrors.forEach((err) => {
        err.fix.fix(page.path, newContents)
      })

      await writeFile(page.path, newContents.join('\n'), 'utf8')
    }
  })

  await Promise.all(result)
  return errors
}

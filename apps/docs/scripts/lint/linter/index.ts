import { readFile, writeFile } from 'fs/promises'
import { Content } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxFromMarkdown } from 'mdast-util-mdx'
import { mdxjs } from 'micromark-extension-mdxjs'
import { extname } from 'path'
import { visit } from 'unist-util-visit'
import { headingsSentenceCase } from '../rules/headings-sentence-case'
import { LintError, LintRule } from '../rules'
import { walk } from '../../utils/walk'
import { testIsContent } from '../utils/mdast'

interface Rules {
  byType: Partial<Record<Content['type'], LintRule[]>>
}

const rules: Rules = {
  byType: {
    heading: [headingsSentenceCase()],
  },
}

interface FileErrors {
  file: string
  errors: LintError[]
}

export async function lint(target: string, options: { autoFix: boolean; isDirectory: boolean }) {
  const pages = options.isDirectory ? await walk(target ?? 'pages') : [{ path: target }]
  const errors: FileErrors[] = []

  const result = pages.map(async (page) => {
    if (extname(page.path) !== '.mdx') {
      return
    }

    const contents = await readFile(page.path, 'utf8')
    const localErrors: LintError[] = []

    const mdxTree = fromMarkdown(contents, {
      extensions: [mdxjs()],
      mdastExtensions: [mdxFromMarkdown()],
    })

    visit(mdxTree, testIsContent, function modify(node, index, parent) {
      if (rules.byType[node.type]) {
        rules.byType[node.type].forEach((rule: LintRule) => {
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

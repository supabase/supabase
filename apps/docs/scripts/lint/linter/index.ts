import { readFile, writeFile } from 'fs/promises'
import { Content } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxFromMarkdown } from 'mdast-util-mdx'
import { mdxjs } from 'micromark-extension-mdxjs'
import { extname } from 'path'
import { headingsSentenceCase } from '../rules/headings-sentence-case'
import { LintError, LintRule } from '../rules'
import { walk } from '../../utils/walk'

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

    mdxTree.children.forEach((child) => {
      if (rules.byType[child.type]) {
        rules.byType[child.type].forEach((rule) => {
          const result = rule.runRule(child, page.path)
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
}

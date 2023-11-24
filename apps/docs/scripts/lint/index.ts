import { mdxFromMarkdown } from 'mdast-util-mdx'
import { mdxjs } from 'micromark-extension-mdxjs'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { readFile, writeFile } from 'fs/promises'
import { walk } from '../utils/walk'
import { extname } from 'path'
import { Content } from 'mdast'
import { headingsSentenceCase } from './rules/headings-sentence-case'
import { LintError, LintRule } from './rules'
import { parseArgs } from 'node:util'

const args = parseArgs({
  options: {
    fix: {
      type: 'boolean',
      short: 'f',
    },
  },
  allowPositionals: true,
})

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

function main() {
  if (args.positionals.length > 1) {
    console.error('This script only takes one positional argument. Ignoring extra arguments.')
  }
  const target = args.positionals[0]
  console.log(`Linting directory: ${target}`)

  const isAutoFixOn = Boolean(args.values.fix)
  if (isAutoFixOn) {
    console.log('Autofixing is on')
  }

  lint(target, { autoFix: isAutoFixOn })
}

async function lint(target: string, options: { autoFix: boolean }) {
  const pages = await walk(target ?? 'pages')
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

main()

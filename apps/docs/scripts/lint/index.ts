import { mdxFromMarkdown } from 'mdast-util-mdx'
import { mdxjs } from 'micromark-extension-mdxjs'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { readFile } from 'fs/promises'
import { walk } from '../utils/walk'
import { extname } from 'path'
import { Content } from 'mdast'
import { headingsSentenceCase } from './rules/headings-sentence-case'
import { admonitionsNoStacking } from './rules/admonitions-no-stacking'

type Rule = (content: Content) => void

interface Rules {
  byType: Partial<Record<Content['type'], Rule[]>>
}

const rules: Rules = {
  byType: {
    heading: [headingsSentenceCase],
    mdxJsxFlowElement: [admonitionsNoStacking],
  },
}

async function lint() {
  const pages = await walk('pages')
  const result = pages.map(async (page) => {
    if (extname(page.path) !== '.mdx') {
      return
    }

    const contents = await readFile(page.path, 'utf8')

    const mdxTree = fromMarkdown(contents, {
      extensions: [mdxjs()],
      mdastExtensions: [mdxFromMarkdown()],
    })

    console.log('File:', page.path)
    mdxTree.children.forEach((child) => {
      if (rules.byType[child.type]) {
        rules.byType[child.type].forEach((rule) => {
          rule(child)
        })
      }
    })
  })

  await Promise.all(result)
}

lint()

import fs from 'fs'

import { CodeHikeConfig, remarkCodeHike } from '@code-hike/mdx'
import codeHikeTheme from 'config/code-hike.theme.json' assert { type: 'json' }
import matter from 'gray-matter'
import remarkGfm from 'remark-gfm'
import type { ICommonMarkdown } from '~/components/reference/Reference.types'
import { bundleMDX } from 'mdx-bundler'
import { serialize } from 'next-mdx-remote/serialize'
import { getMDXComponent } from 'mdx-bundler/client'

async function generateRefMarkdown(sections: ICommonMarkdown[], slug: string) {
  let markdownContent = []
  /**
   * Read all the markdown files that might have
   *  - custom text
   *  - call outs
   *  - important notes regarding implementation
   */
  await Promise.all(
    sections.map(async (section) => {
      const isSharedSection = section.meta?.shared
      const pathName = `docs/ref${isSharedSection ? '/shared' : slug}/${section.id}.mdx`

      function checkFileExists(x) {
        if (fs.existsSync(x)) {
          return true
        } else {
          return false
        }
      }

      const markdownExists = checkFileExists(pathName)

      if (!markdownExists) return null

      const fileContents = markdownExists ? fs.readFileSync(pathName, 'utf8') : ''

      const codeHikeOptions: CodeHikeConfig = {
        theme: codeHikeTheme,
        lineNumbers: true,
        showCopyButton: true,
        skipLanguages: [],
        autoImport: false,
      }

      const { data, content } = matter(fileContents)
      const globals = {
        '@mdx-js/react': {
          varName: 'MdxJsReact',
          namedExports: ['useMDXComponents'],
          defaultExport: false,
        },
      }

      const { code } = await bundleMDX({
        source: content,
        globals,
        mdxOptions(options) {
          return {
            ...options,
            useDynamicImport: true,
            remarkPlugins: [remarkGfm, [remarkCodeHike, codeHikeOptions]],
            providerImportSource: '@mdx-js/react',
          }
        },
      })

      markdownContent.push({
        id: section.id,
        title: section.title,
        meta: data,
        // introPage: introPages.includes(x),
        content: code,
      })
    })
  )

  return markdownContent
}

export default generateRefMarkdown

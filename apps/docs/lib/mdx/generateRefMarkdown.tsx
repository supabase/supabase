import fs from 'fs'

import { CodeHikeConfig, remarkCodeHike } from '@code-hike/mdx'
import codeHikeTheme from 'config/code-hike.theme.json' assert { type: 'json' }
import matter from 'gray-matter'
import { serialize } from 'next-mdx-remote/serialize'
import remarkGfm from 'remark-gfm'
import { ICommonMarkdown } from '~/components/reference/Reference.types'

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
      const pathName = `docs/ref${slug}/${section.id}.mdx`

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
      const { data, content } = matter(fileContents)

      const codeHikeOptions: CodeHikeConfig = {
        theme: codeHikeTheme,
        lineNumbers: true,
        showCopyButton: true,
        skipLanguages: [],
        autoImport: false,
      }

      markdownContent.push({
        id: section.id,
        title: section.title,
        meta: data,
        // introPage: introPages.includes(x),
        content: content
          ? await serialize(content ?? '', {
              // MDX's available options, see the MDX docs for more info.
              // https://mdxjs.com/packages/mdx/#compilefile-options
              mdxOptions: {
                useDynamicImport: true,
                remarkPlugins: [remarkGfm, [remarkCodeHike, codeHikeOptions]],
              },
              // Indicates whether or not to parse the frontmatter from the mdx source
            })
          : null,
      })
    })
  )

  return markdownContent
}

export default generateRefMarkdown

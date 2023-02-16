import fs from 'fs'

import matter from 'gray-matter'
import { serialize } from 'next-mdx-remote/serialize'

// import { remarkCodeHike } from '@code-hike/mdx'
// import codeHikeTheme from '~/codeHikeTheme.js'
// import theme from 'shiki/themes/solarized-dark.json'

async function generateRefMarkdown(sections, slug) {
  let markdownContent = []
  /**
   * Read all the markdown files that might have
   *  - custom text
   *  - call outs
   *  - important notes regarding implementation
   */
  await Promise.all(
    sections.map(async (x, i) => {
      if (!x.id) return null

      const pathName = `docs/ref${slug}/${x.id}.mdx`

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

      markdownContent.push({
        id: x.id,
        title: x.title,
        meta: data,
        // introPage: introPages.includes(x),
        content: content
          ? await serialize(content ?? '', {
              // MDX's available options, see the MDX docs for more info.
              // https://mdxjs.com/packages/mdx/#compilefile-options
              mdxOptions: {
                // remarkPlugins: [[remarkCodeHike, { autoImport: false, theme }]],
                useDynamicImport: true,
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

import fs from 'fs'

import matter from 'gray-matter'
import { serialize } from 'next-mdx-remote/serialize'

import { remarkCodeHike } from '@code-hike/mdx'
import codeHikeTheme from '~/codeHikeTheme.js'
import theme from 'shiki/themes/solarized-dark.json'

function checkFileExists(x) {
  if (fs.existsSync(x)) {
    return true
  } else {
    return false
  }
}

function checkFunctionExists(x) {
  // console.log(x)
  if (x.id) {
    return true
  } else {
    return false
  }
}

async function generateRefMarkdown(sections, slug, spec) {
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

      const markdownExists = checkFileExists(pathName)

      if (markdownExists) {
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
                  remarkPlugins: [[remarkCodeHike, { autoImport: false, theme: codeHikeTheme }]],
                  useDynamicImport: true,
                },
                // Indicates whether or not to parse the frontmatter from the mdx source
              })
            : null,
        })
      } else {
        const foundFunction = spec.functions.find((item: any) => item.id === x.id)
        if (!foundFunction) return null

        // console.log('found function:', foundFunction.id)

        let examples = []

        if (foundFunction.examples) {
          await Promise.all(
            foundFunction.examples.map(async (example, i) => {
              console.log('*** new function ***')
              console.log(example?.id)
              console.log(example?.description)
              // console.log('about to do example: ', example.id, example.name)
              examples.push({
                id: example?.id,
                name: example?.name,
                code: example?.code
                  ? await serialize(example.code, {
                      mdxOptions: {
                        remarkPlugins: [
                          [remarkCodeHike, { autoImport: false, theme: codeHikeTheme }],
                        ],
                      },
                    })
                  : null,
                response: example?.response
                  ? await serialize(example.response, {
                      mdxOptions: {
                        remarkPlugins: [
                          [remarkCodeHike, { autoImport: false, theme: codeHikeTheme }],
                        ],
                      },
                    })
                  : null,
                data: {
                  sql: example?.data?.sql
                    ? await serialize(example.data.sql, {
                        mdxOptions: {
                          remarkPlugins: [
                            [remarkCodeHike, { autoImport: false, theme: codeHikeTheme }],
                          ],
                        },
                      })
                    : null,
                },
                // description: example?.description
                //   ? await serialize(example.description, {
                //       mdxOptions: {
                //         remarkPlugins: [
                //           [remarkCodeHike, { autoImport: false, theme: codeHikeTheme }],
                //         ],
                //       },
                //     })
                //   : null,
              })
            })
          )
        }

        markdownContent.push({
          id: foundFunction.id,
          title: foundFunction.title,
          examples,
        })
      }
    })
  )

  return markdownContent
}

export default generateRefMarkdown

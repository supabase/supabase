// pages/index.js

import fs from 'fs'
import matter from 'gray-matter'
import { MDXRemote } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import components from '~/components/index'
import { getAllDocs } from '~/lib/docs'

import ReactMarkdown from 'react-markdown'

// @ts-ignore
import jsSpec from '~/../../spec/supabase_js_v2_temp.yaml'
import CodeBlock from '~/components/CodeBlock/CodeBlock'
import { Tabs } from '~/../../packages/ui'

export default function Post(props) {
  return (
    <div className="my-32 mx-5 mx-auto">
      <div className="flex flex-col gap-16 max-w-7xl mx-auto">
        {props.docs.map((x) => {
          return (
            <div className="grid grid-cols-2 gap-16">
              <article className="prose" key={x.id}>
                <h1>{x.title ?? x.id}</h1>
                {x.content && (
                  <div>
                    <MDXRemote {...x.content} components={components} />
                  </div>
                )}
                {jsSpec.pages[x.id].notes && (
                  <div>
                    <ReactMarkdown>{jsSpec.pages[x.id].notes}</ReactMarkdown>
                  </div>
                )}
              </article>
              <div className="bg-scale-100 h-96 w-full">
                {/* <Tabs defaultActiveId={'hello 0'} size="small" type="underlined"> */}
                {jsSpec.pages[x.id].examples &&
                  jsSpec.pages[x.id].examples.map((x, i) => {
                    return <pre>{x.js}</pre>
                  })}
                {/* </Tabs> */}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export async function getStaticProps({ params }: { params: { slug: string[] } }) {
  /**
   * This is our collection of human readable titles and IDs
   */
  let markdownDocs = [
    {
      title: 'Inserting data',
      id: 'select()',
    },
    { title: 'Deleting data', id: 'delete()' },
  ]

  const pages = Object.keys(jsSpec.pages)
  // console.log('pages', pages)

  /**
   * Read all the markdown files that might have
   *  - custom text
   *  - call outs
   *  - important notes regarding implementation
   */
  const allMarkdownDocs = await Promise.all(
    pages.map(async (x, i) => {
      // const doc = getDocsBySlug(`docs/ref/database/${x}`)

      // if (i >= 5) return null

      const pathName = `docs/ref/js/${x}.mdx`

      function checkFileExists(x) {
        console.log('checking this ', x)
        if (fs.existsSync(x)) {
          return true
        } else {
          return false
        }
      }

      const markdownExists = checkFileExists(pathName)

      const fileContents = markdownExists ? fs.readFileSync(pathName, 'utf8') : ''
      const { data, content } = matter(fileContents)
      console.log('docBySlug', content)
      // console.log()
      return {
        id: x,
        title: x,
        // ...content,
        meta: data,
        content: content ? await serialize(content || '') : null,
      }
    })
  )

  console.log('allMarkdownDocs', allMarkdownDocs)

  return {
    props: {
      docs: allMarkdownDocs,
    },
  }
}

export function getStaticPaths() {
  let docs = getAllDocs()

  return {
    paths: docs.map(() => {
      return {
        params: {
          slug: docs.map((d) => d.slug),
        },
      }
    }),
    fallback: 'blocking',
  }
}

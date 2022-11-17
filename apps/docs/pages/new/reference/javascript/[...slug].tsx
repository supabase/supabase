import {
  useEffect,
  // useRef,
  useState,
} from 'react'
// pages/index.js

import fs from 'fs'

import matter from 'gray-matter'
import { MDXRemote } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import components from '~/components/index'
import { getAllDocs } from '~/lib/docs'
import NavigationMenu from '~/components/Navigation/NavigationMenu/NavigationMenu'
import ReactMarkdown from 'react-markdown'

// @ts-ignore
import jsTypeSpec from '~/../../spec/enrichments/tsdoc_v2/combined.json'
// @ts-ignore
import examples from '~/../../spec/examples/examples.yml' assert { type: 'yml' }
// @ts-expect-error
import jsSpec from '~/../../spec/supabase_js_v2_temp_new_shape.yml' assert { type: 'yml' }

import { IconDatabase, Tabs } from 'ui'
import CodeBlock from '~/components/CodeBlock/CodeBlock'

import { useRouter } from 'next/router'
import { extractTsDocNode, generateParameters } from '~/lib/refGenerator/helpers'
import { ComesFrom } from '~/components/ComesFrom'

import LibraryNavigationMenu from '~/components/Navigation/NavigationMenu/LibraryNavigationMenu'
import Layout from '~/layouts/ReferenceDocsLayout'
import StickySectionHeader from '~/components/StickySectionHeader'

export default function Ref(props) {
  const menuItems = jsSpec.functions.map((item) => {
    return {
      id: item.id,
      title: item.title,
    }
  })

  const router = useRouter()

  function updateUrl(key) {
    router.replace(
      {
        pathname: `/ref/js/${key}`,
      },
      undefined,
      { scroll: false }
    )
  }

  return (
    <div className="grid grid-cols-12 opacity-100 duration-100 max-w-[1400px] mx-auto py-16 gap-4 px-5">
      <div className="col-span-3">
        <div className="px-10 sticky top-24">
          <NavigationMenu />
          <LibraryNavigationMenu items={menuItems} />
        </div>
      </div>
      <div className="col-span-9">
        <div className="flex flex-col gap-32 mx-auto max-w-5xl">
          {jsSpec.functions.map((item, itemIndex) => {
            const hasTsRef = item['$ref'] || null

            const tsDefinition = hasTsRef && extractTsDocNode(hasTsRef, jsTypeSpec)

            const parameters = hasTsRef ? generateParameters(tsDefinition) : ''

            const functionMarkdownContent = props?.docs[itemIndex]?.content

            const shortText = hasTsRef ? tsDefinition.signatures[0].comment.shortText : ''
            const itemId = examples.functions[itemIndex].id
              ? examples.functions[itemIndex].id
              : null
            const itemTitle = examples.functions[itemIndex].title
              ? examples.functions[itemIndex].title
              : null

            return (
              <>
                {itemId && itemTitle && <StickySectionHeader title={item.title} />}

                <div
                  className="grid grid-cols-2 pb-32 ref-container gap-10"
                  id={item.id}
                  // ref={sectionRef}
                >
                  <div className="prose" key={item.id}>
                    {shortText && (
                      <>
                        <ComesFrom
                          link="https://raw.githubusercontent.com/supabase/supabase/master/spec/enrichments/tsdoc_v2/combined.json"
                          text="combined.json"
                        />
                        <p
                          className="text-lg not-prose"
                          dangerouslySetInnerHTML={{ __html: shortText }}
                        ></p>
                      </>
                    )}

                    {examples.functions[itemIndex].description && (
                      <>
                        <ComesFrom
                          link="https://github.com/supabase/supabase/pull/10095/files#diff-c514c66b77772b9e3d9a5403c136ee52dfeaaeacb1d8138ea85ce35ee64e5006"
                          text="examples.yml"
                        />
                        <p className="text-lg not-prose">
                          {examples.functions[itemIndex].description}
                        </p>
                      </>
                    )}
                    <hr />
                    {functionMarkdownContent && (
                      <>
                        <ComesFrom
                          link="https://github.com/supabase/supabase/pull/10095/files#diff-bf42aab7d324c5330e4ae65d94803cd6da686d2241015536b0263e7f76aeca35"
                          text="auth.signUp().mdx"
                        />
                        <MDXRemote {...functionMarkdownContent} components={components} />
                      </>
                    )}
                    {item.notes && (
                      <div>
                        <ComesFrom
                          link="https://github.com/supabase/supabase/blob/master/spec/supabase_js_v2.yml#L105"
                          text="supabase_js_v2"
                        />
                        <ReactMarkdown>{item.notes}</ReactMarkdown>
                      </div>
                    )}
                    {/* // parameters */}
                    {parameters && (
                      <>
                        <ComesFrom
                          link="https://github.com/supabase/supabase/blob/master/spec/enrichments/tsdoc_v2/combined.json"
                          text="combined.json"
                        />
                        <div dangerouslySetInnerHTML={{ __html: parameters }}></div>
                      </>
                    )}
                  </div>
                  <div className="w-full">
                    <div className="sticky top-24">
                      {item.examples && (
                        <>
                          {' '}
                          <ComesFrom
                            className="mb-5"
                            link="https://github.com/supabase/supabase/blob/master/spec/supabase_js_v2.yml"
                            text="supabase_js_v2"
                          />
                          <Tabs
                            defaultActiveId={item.examples[0].id}
                            size="small"
                            type="underlined"
                            scrollable
                          >
                            {item.examples &&
                              item.examples.map((example, exampleIndex) => {
                                const exampleString = `
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient('https://xyzcompany.supabase.co', 'public-anon-key')
`
                                const currentExampleId = example.id
                                const staticExample =
                                  examples.functions[itemIndex].examples[exampleIndex]

                                const response = staticExample.response
                                const sql = staticExample?.data?.sql
                                const tables = staticExample?.data?.tables

                                return (
                                  <Tabs.Panel id={example.id} label={example.name}>
                                    {tables &&
                                      tables.length > 0 &&
                                      tables.map((table) => {
                                        return (
                                          <div className="bg-scale-300 border rounded prose max-w-none">
                                            <div className="bg-scale-200 px-5 py-2">
                                              <div className="flex gap-2 items-center">
                                                <div className="text-brand-900">
                                                  <IconDatabase size={16} />
                                                </div>
                                                <h5 className="text-xs text-scale-1200">
                                                  {table.name}
                                                </h5>
                                              </div>
                                            </div>

                                            {/* <ReactMarkdown>{table.content}</ReactMarkdown> */}
                                            {/* {content && <MDXRemote {...content} />} */}
                                          </div>
                                        )
                                      })}
                                    {sql && (
                                      <CodeBlock
                                        className="useless-code-block-class"
                                        language="sql"
                                        hideLineNumbers={true}
                                      >
                                        {sql}
                                      </CodeBlock>
                                    )}
                                    <CodeBlock
                                      className="useless-code-block-class"
                                      language="js"
                                      hideLineNumbers={true}
                                    >
                                      {exampleString +
                                        (example.code &&
                                          example.code
                                            .replace('```', '')
                                            .replace('js', '')
                                            .replace('```', ''))}
                                    </CodeBlock>
                                    {response && (
                                      <>
                                        <ComesFrom
                                          className="mb-5 mt-5"
                                          link="https://github.com/supabase/supabase/pull/10095/files#diff-c514c66b77772b9e3d9a5403c136ee52dfeaaeacb1d8138ea85ce35ee64e5006"
                                          text="examples.yml"
                                        />
                                        <CodeBlock
                                          className="useless-code-block-class"
                                          language="json"
                                          hideLineNumbers={true}
                                        >
                                          {response}
                                        </CodeBlock>
                                      </>
                                    )}
                                  </Tabs.Panel>
                                )
                              })}
                          </Tabs>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )
          })}
        </div>
      </div>
    </div>
  )
}

Ref.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>
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

  const pages = jsSpec.functions.map((x) => x.id)
  //console.log('pages', pages)

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
        // console.log('checking this ', x)
        if (fs.existsSync(x)) {
          return true
        } else {
          return false
        }
      }

      const markdownExists = checkFileExists(pathName)

      //console.log(x, 'markdownExists', markdownExists)

      const fileContents = markdownExists ? fs.readFileSync(pathName, 'utf8') : ''
      const { data, content } = matter(fileContents)
      // console.log('docBySlug', content)
      // console.log()

      //if (content) console.log(content)
      return {
        id: x,
        title: x,
        // ...content,
        meta: data,
        content: content ? await serialize(content || '') : null,
      }
    })
  )

  // console.log('allMarkdownDocs', allMarkdownDocs)

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

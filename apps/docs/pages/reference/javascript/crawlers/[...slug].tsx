import { useEffect } from 'react'
import fs from 'fs'
import toc from 'markdown-toc'

import matter from 'gray-matter'
import { MDXRemote } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import components from '~/components/index'
import { getAllDocs, getDocsBySlug } from '~/lib/docs'

import ReactMarkdown from 'react-markdown'

// @ts-ignore
import jsTypeSpec from '~/../../spec/enrichments/tsdoc_v2/combined.json'
// @ts-ignore
import examples from '~/../../spec/examples/examples.yml' assert { type: 'yml' }
// @ts-expect-error
import jsSpec from '~/../../spec/supabase_js_v2_temp_new_shape.yml' assert { type: 'yml' }
// @ts-expect-error
import commonLibSpec from '~/../../spec/common-client-libs.yml' assert { type: 'yml' }

import { IconDatabase, Tabs } from 'ui'
import CodeBlock from '~/components/CodeBlock/CodeBlock'

import { useRouter } from 'next/router'
import { extractTsDocNode, generateParameters } from '~/lib/refGenerator/helpers'
import { ComesFrom } from '~/components/ComesFrom'
import Param from '~/components/Params'
import Options from '~/components/Options'
import RefSubLayout from '~/layouts/ref/RefSubLayout'

import OldLayout from '~/layouts/Default'

export default function JSReference(props) {
  const router = useRouter()

  // will be something like: auth-signout
  const slug = router.query.slug[0]

  // look in the common-libs file for that slug, return its id
  const commonId = commonLibSpec.functions.find((fn) => fn.slug === slug).id

  const requestedFunction = jsSpec.functions.find((fn) => fn.id === commonId)

  /*
   * handle old ref pages
   */
  if (process.env.NEXT_PUBLIC_NEW_DOCS === 'false') {
    return (
      // @ts-ignore
      <OldLayout meta={props.meta} toc={props.toc}>
        <MDXRemote {...props.content} components={components} />
      </OldLayout>
    )
  }

  const hasTsRef = requestedFunction['$ref'] || null
  const tsDefinition = hasTsRef && extractTsDocNode(hasTsRef, jsTypeSpec)
  const parameters = hasTsRef ? generateParameters(tsDefinition) : ''

  //const functionMarkdownContent = props?.docs[itemIndex]?.content
  const shortText = hasTsRef ? tsDefinition.signatures[0].comment.shortText : ''

  return (
    <RefSubLayout>
      <>
        <RefSubLayout.Section
          key={requestedFunction.id}
          title={
            examples.functions.find((fn) => fn.id === requestedFunction.id)?.title ??
            examples.functions.find((fn) => fn.id === requestedFunction.id)?.id ??
            requestedFunction.name ??
            requestedFunction.id
          }
          id={requestedFunction.id}
          slug={
            commonLibSpec.functions.find((commonItem) => commonItem.id === requestedFunction.id)
              .slug
          }
        >
          <RefSubLayout.Details>
            <>
              <header className={['mb-16'].join(' ')}>
                {shortText && (
                  <>
                    <p
                      className="text-sm text-scale-1100"
                      dangerouslySetInnerHTML={{ __html: shortText }}
                    ></p>
                  </>
                )}
              </header>

              {requestedFunction.description && (
                <div className="prose">
                  <p className="text-sm">{requestedFunction.description}</p>
                </div>
              )}
              {/* {functionMarkdownContent && (
                <div className="prose">
                  <MDXRemote {...functionMarkdownContent} components={components} />
                </div>
              )} */}
              {requestedFunction.notes && (
                <div className="prose">
                  <ReactMarkdown className="text-sm">{requestedFunction.notes}</ReactMarkdown>
                </div>
              )}
              {/* // parameters */}
              {parameters && (
                <div className="not-prose mt-12">
                  <h5 className="mb-3 text-base text-scale-1200">Parameters</h5>
                  <ul className="">
                    {parameters.map((param) => {
                      // grab override params from yaml file
                      const overrideParams = requestedFunction.overrideParams

                      // params from the yaml file can override the params from parameters if it matches the name
                      const overide = overrideParams?.filter((x) => {
                        return param.name === x.name
                      })

                      const paramItem = overide?.length > 0 ? overide[0] : param

                      return (
                        <Param {...paramItem}>
                          {paramItem.subContent && (
                            <div className="mt-3">
                              <Options>
                                {param.subContent.map((param) => {
                                  return <Options.Option {...param} />
                                })}
                              </Options>
                            </div>
                          )}
                        </Param>
                      )
                    })}
                  </ul>
                </div>
              )}
            </>
          </RefSubLayout.Details>
          <RefSubLayout.Examples>
            {requestedFunction.examples && (
              <>
                {' '}
                <ComesFrom
                  className="mb-5"
                  link="https://github.com/supabase/supabase/blob/master/spec/supabase_js_v2.yml"
                  text="supabase_js_v2"
                />
                <Tabs
                  defaultActiveId={requestedFunction.examples[0].id}
                  size="small"
                  type="underlined"
                  scrollable
                >
                  {requestedFunction.examples &&
                    requestedFunction.examples.map((example, exampleIndex) => {
                      const exampleString = `
  import { createClient } from '@supabase/supabase-js'

  // Create a single supabase client for interacting with your database
  const supabase = createClient('https://xyzcompany.supabase.co', 'public-anon-key')
  `
                      const currentExampleId = example.id
                      const staticExample = requestedFunction.examples[exampleIndex]

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
                                      <h5 className="text-xs text-scale-1200">{table.name}</h5>
                                    </div>
                                  </div>
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
          </RefSubLayout.Examples>
        </RefSubLayout.Section>
      </>
    </RefSubLayout>
  )
}

export async function getStaticProps({ params }: { params: { slug: string[] } }) {
  const pages = jsSpec.functions.map((x) => x.id)

  /**
   * Read all the markdown files that might have
   *  - custom text
   *  - call outs
   *  - important notes regarding implementation
   */
  const allMarkdownDocs = await Promise.all(
    pages.map(async (x, i) => {
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

      const fileContents = markdownExists ? fs.readFileSync(pathName, 'utf8') : ''
      const { data, content } = matter(fileContents)

      return {
        id: x,
        title: x,
        // ...content,
        meta: data,
        content: content ? await serialize(content || '') : null,
      }
    })
  )

  /*
   * old content generation
   * this is for grabbing to old markdown files
   */

  let slug
  if (params.slug.length > 1) {
    slug = `docs/reference/javascript/${params.slug.join('/')}`
  } else {
    slug = `docs/reference/javascript/${params.slug[0]}`
  }

  let doc = getDocsBySlug(slug)
  const content = await serialize(doc.content || '')

  /*
   * handle old ref pages
   */
  if (process.env.NEXT_PUBLIC_NEW_DOCS === 'false') {
    return {
      props: {
        /*
         * old reference docs are below
         */
        ...doc,
        content,
        toc: toc(doc.content, { maxdepth: 1, firsth1: false }),
      },
    }
  } else {
    return {
      props: {
        docs: allMarkdownDocs,
      },
    }
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

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
import remarkGfm from 'remark-gfm'
import components from '~/components/index'
import { getAllDocs } from '~/lib/docs'

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
import Link from 'next/link'

const marginTop = 256
export default function Ref(props) {
  // const myRef = useRef(null)

  //console.log('props', props)
  // console.log({ jsSpec })

  const [offsetY, setOffsetY] = useState(0)
  const [sections, setSections] = useState([])

  // useEffect(() => {
  //   window.scrollTo(0, 0)
  //   setOffsetY(0)
  // }, [])

  useEffect(() => {
    const els: HTMLElement[] = Array.from(document.querySelectorAll('div.ref-container'))

    const allSections = els.map((el: HTMLElement, index: number) => {
      const { top: boundingTop } = el.getBoundingClientRect()

      return {
        topic: el.getAttribute('id')!,
        boundingTop,
        isActive: index === 0,
      }
    })

    // console.log('allSections', allSections)
    setSections(allSections)
  }, [])

  // useEffect(() => {
  //   if (sections.length <= 1) return

  //   const onScroll = () => {
  //     console.log('SCROLL EVENT')
  //     setOffsetY(window.pageYOffset)
  //   }
  //   window.addEventListener('scroll', debounce(onScroll, 500))

  //   return () => window.removeEventListener('scroll', onScroll)
  // }, [sections])

  // useEffect(() => {
  //   if (sections.length === 0) return

  //   if (sections.length === 1) {
  //     sections[0].isActive = true
  //     return
  //   }

  //   sections.forEach((section, index) => {
  //     if (index === 0) {
  //       section.isActive = sections[index + 1].boundingTop > offsetY + marginTop
  //     } else {
  //       if (sections[index + 1]) {
  //         section.isActive =
  //           sections[index + 1].boundingTop > offsetY + marginTop &&
  //           sections[index].boundingTop <= offsetY + marginTop
  //       } else {
  //         section.isActive = sections[index].boundingTop <= offsetY + marginTop
  //       }
  //     }
  //   })
  // }, [sections, offsetY])

  // useEffect(() => {
  //   const observer = new IntersectionObserver((entries) => {
  //     // console.log('entries', entries)
  //     const entry = entries[0]
  //     // console.log('entry', entry)
  //   })
  //   // console.log('myRef', myRef.current)
  //   observer.observe(myRef.current)
  // }, [])

  const router = useRouter()

  function updateUrl(key) {
    // router.replace(
    //   {
    //     pathname: `/ref/js/${key}`,
    //     // query: { sortBy: 'price' },
    //   }
    //   // undefined,
    //   // { shallow: true }
    // )
    router.replace(
      {
        pathname: `/ref/js/${key}`,
        // query: { sortBy: 'price' },
      },
      undefined,
      { scroll: false }
    )
  }

  return (
    <div>
      <div className="flex my-16">
        <div className="px-10 fixed">
          {sections.map((x, i) => {
            return (
              <Link href={`#${x.topic}`} key={i}>
                <a
                  className={[
                    'block text-sm hover:text-scale-1200 text-scale-1100 cursor-pointer',
                    sections && sections[i].isActive ? 'text-brand-900' : 'text-scale-1100',
                  ].join(' ')}
                  // key={i}
                  // onClick={() => {
                  //   window.scrollTo(0, x.boundingTop - marginTop)
                  //   setOffsetY(x.boundingTop - marginTop)
                  // }}
                >
                  {x.topic}
                </a>
              </Link>
            )
          })}
        </div>

        <div className="ml-64 w-full">
          <div
            className="flex flex-col gap-32 mx-auto max-w-5xl"
            // ref={myRef}
          >
            {jsSpec.functions.map((item, itemIndex) => {
              if (item['$ref']) console.log('$ref', item['$ref'])
              // if (item.id !== 'select()') return <div>hidden section</div>
              // const sectionRef = useRef(null)

              // console.log('x', x)
              const hasTsRef = item['$ref'] || null
              // console.log('hasTsRef', hasTsRef)
              // console.log('jsTypeSpec', jsTypeSpec)
              const tsDefinition = hasTsRef && extractTsDocNode(hasTsRef, jsTypeSpec)
              console.log('tsDefinition', tsDefinition)
              // console.log(`tsDefinition for ${item.title ?? item.id}`, tsDefinition)

              // useEffect(() => {
              //   const observer = new IntersectionObserver((entries) => {
              //     // console.log('entries', entries)
              //     const entry = entries[0]

              //     // console.log(
              //     //   x.id,
              //     //   'intersectiong',
              //     //   entry.isIntersecting,
              //     //   'visible',
              //     //   entry.isVisible
              //     // )
              //   })
              //   // console.log('myRef', myRef.current)
              //   observer.observe(sectionRef.current)
              // }, [])

              const parameters = hasTsRef ? generateParameters(tsDefinition) : ''

              // @ts-ignore
              // const [serialFunctionMarkdownContent, setSerialFunctionMarkdownContent] =
              //   useState(null)

              const functionMarkdownContent = props?.docs[itemIndex]?.content

              // useEffect(() => {
              //   async function makeContent() {
              //     setSerialFunctionMarkdownContent(
              //       await serialize(functionMarkdownContent, {
              //         mdxOptions: {
              //           remarkPlugins: [remarkGfm],
              //           format: 'mdx',
              //         },
              //       })
              //     )
              //   }
              //   makeContent()
              // }, [])

              // console.log('serialFunctionMarkdownContent', serialFunctionMarkdownContent)

              const shortText = hasTsRef ? tsDefinition.signatures[0].comment.shortText : ''

              return (
                <>
                  <header className="sticky top-14 bg-gray-600 z-10 p-4">
                    <h1 className="text-3xl not-prose" onClick={() => updateUrl(item.id)}>
                      {examples.functions[itemIndex].title ??
                        examples.functions[itemIndex].id ??
                        item.name ??
                        item.id}
                    </h1>
                  </header>
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
                                          console.log(table)

                                          // @ts-ignore
                                          // const [content, setContent] = useState(null)

                                          // // @ts-ignore
                                          // useEffect(() => {
                                          //   async function makeContent() {
                                          //     setContent(
                                          //       await serialize(table.content, {
                                          //         mdxOptions: {
                                          //           remarkPlugins: [remarkGfm],
                                          //           format: 'mdx',
                                          //         },
                                          //       })
                                          //     )
                                          //   }
                                          //   makeContent()
                                          // }, [])

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

  const pages = jsSpec.functions.map((x) => x.id)
  console.log('pages', pages)

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

      console.log(x, 'markdownExists', markdownExists)

      const fileContents = markdownExists ? fs.readFileSync(pathName, 'utf8') : ''
      const { data, content } = matter(fileContents)
      // console.log('docBySlug', content)
      // console.log()

      if (content) console.log(content)
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

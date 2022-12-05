import {
  useEffect,
  // useRef,
  useState,
} from 'react'
// pages/index.js

import fs from 'fs'
import toc from 'markdown-toc'

import matter from 'gray-matter'
import { MDXRemote } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import remarkGfm from 'remark-gfm'
import components from '~/components/index'
import { getAllDocs, getDocsBySlug } from '~/lib/docs'

import ReactMarkdown from 'react-markdown'

// @ts-ignore
import jsTypeSpec from '~/../../spec/enrichments/tsdoc_v1/combined.json'
// @ts-ignore
import examples from '~/../../spec/examples/examples.yml' assert { type: 'yml' }
// @ts-expect-error
import jsSpec from '~/../../spec/supabase_js_v1_temp_new_shape.yml' assert { type: 'yml' }

import { IconDatabase, Tabs } from 'ui'
import CodeBlock from '~/components/CodeBlock/CodeBlock'

import { useRouter } from 'next/router'
import { extractTsDocNode, generateParameters } from '~/lib/refGenerator/helpers'

import OldLayout from '~/layouts/Default'

const marginTop = 256
export default function Ref(props) {
  // const myRef = useRef(null)

  console.log('props', props)

  const [offsetY, setOffsetY] = useState(0)
  const [sections, setSections] = useState([])

  const isNewDocs = process.env.NEXT_PUBLIC_NEW_DOCS === 'true'

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

  /*
   * handle old ref pages
   */
  if (isNewDocs) {
    return (
      // @ts-ignore
      <OldLayout meta={props.meta} toc={props.toc}>
        <MDXRemote {...props.content} components={components} />
      </OldLayout>
    )
  }

  return (
    <div>
      <div className="flex my-16">
        <div className="px-10 fixed">
          {sections.map((x, i) => {
            return (
              <a
                className={[
                  'block text-sm hover:text-scale-1200 text-scale-1100 cursor-pointer',
                  sections && sections[i].isActive ? 'text-brand-900 text-scale-900' : '',
                ].join(' ')}
                key={i}
                onClick={() => {
                  window.scrollTo(0, x.boundingTop - marginTop)
                  setOffsetY(x.boundingTop - marginTop)
                }}
              >
                {x.topic}
              </a>
            )
          })}
        </div>

        <div className="ml-64 w-full">
          <div
            className="flex flex-col gap-32 mx-auto max-w-5xl"
            // ref={myRef}
          >
            {jsSpec.functions.map((item, itemIndex) => {
              // if (item.id !== 'select()') return <div>hidden section</div>
              // const sectionRef = useRef(null)

              // console.log('x', x)
              const hasTsRef = item['$ref'] || null
              // console.log('hasTsRef', hasTsRef)
              // console.log('jsTypeSpec', jsTypeSpec)
              const tsDefinition = hasTsRef && extractTsDocNode(hasTsRef, jsTypeSpec)
              // console.log('tsDefinition', tsDefinition)
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

              return (
                <>
                  <header className="sticky top-0 bg-gray-600 z-10 p-4">
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
                      <p className="text-lg not-prose">
                        {examples.functions[itemIndex].description}
                      </p>

                      <hr />
                      {functionMarkdownContent && (
                        <MDXRemote {...functionMarkdownContent} components={components} />
                      )}

                      {item.notes && (
                        <div>
                          <ReactMarkdown>{item.notes}</ReactMarkdown>
                        </div>
                      )}

                      {/* // parameters */}
                      {/* 
                      @ts-expect-error */}
                      {parameters && <div dangerouslySetInnerHTML={{ __html: parameters }}></div>}
                    </div>
                    <div className="w-full">
                      <div className="sticky top-24">
                        {item.examples && (
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
                                  examples?.functions[itemIndex]?.examples &&
                                  examples?.functions[itemIndex]?.examples[exampleIndex]

                                const response = staticExample?.response
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
                                      <CodeBlock
                                        className="useless-code-block-class"
                                        language="json"
                                        hideLineNumbers={true}
                                      >
                                        {response}
                                      </CodeBlock>
                                    )}
                                  </Tabs.Panel>
                                )
                              })}
                          </Tabs>
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

  /*
   * handle old ref pages
   */
  if (process.env.NEXT_PUBLIC_NEW_DOCS === 'false') {
    let doc = getDocsBySlug(slug)
    const content = await serialize(doc.content || '')
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

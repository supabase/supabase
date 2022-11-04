import { useEffect, useRef, useState } from 'react'
// pages/index.js

import fs from 'fs'
import matter from 'gray-matter'
import { MDXRemote } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import components from '~/components/index'
import { getAllDocs } from '~/lib/docs'
import { debounce } from 'lodash'

import ReactMarkdown from 'react-markdown'

// @ts-ignore
import jsSpec from '~/../../spec/supabase_js_v2_temp.yaml'
import CodeBlock from '~/components/CodeBlock/CodeBlock'
import { Tabs } from '~/../../packages/ui'

import { useRouter } from 'next/router'

const marginTop = 256
export default function Ref(props) {
  const myRef = useRef(null)

  const [offsetY, setOffsetY] = useState(0)
  const [sections, setSections] = useState([])

  useEffect(() => {
    window.scrollTo(0, 0)
    setOffsetY(0)
  }, [])

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

    console.log('allSections', allSections)
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
          <div className="flex flex-col gap-32 mx-auto max-w-5xl" ref={myRef}>
            {props.docs.map((x) => {
              const sectionRef = useRef(null)

              useEffect(() => {
                const observer = new IntersectionObserver((entries) => {
                  // console.log('entries', entries)
                  const entry = entries[0]

                  console.log(
                    x.id,
                    'intersectiong',
                    entry.isIntersecting,
                    'visible',
                    entry.isVisible
                  )
                })
                // console.log('myRef', myRef.current)
                observer.observe(sectionRef.current)
              }, [])

              return (
                <div className="grid grid-cols-2 pb-32 ref-container" id={x.id} ref={sectionRef}>
                  <div className="prose" key={x.id}>
                    <h1 className="text-3xl not-prose" onClick={() => updateUrl(x.id)}>
                      {x.title ?? x.id}
                    </h1>
                    {x.content && (
                      <div className="prose">
                        <MDXRemote {...x.content} components={components} />
                      </div>
                    )}
                    {jsSpec.pages[x.id].notes && (
                      <div>
                        <ReactMarkdown>{jsSpec.pages[x.id].notes}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                  <div className="w-full">
                    {jsSpec.pages[x.id].examples && (
                      <Tabs
                        defaultActiveId={jsSpec.pages[x.id].examples[0].name}
                        size="small"
                        type="underlined"
                        scrollable
                      >
                        {jsSpec.pages[x.id].examples &&
                          jsSpec.pages[x.id].examples.map((x, i) => {
                            return (
                              <Tabs.Panel id={x.name} label={x.name}>
                                <CodeBlock lang="js" className="useless-code-block-class">
                                  {x.js && x.js.replace('```', '').replace('js', '')}
                                </CodeBlock>
                                <CodeBlock lang="js" className="useless-code-block-class">
                                  {`{ 
  data: [
    {
      id: 1,
      name: 'Afghanistan',
    },
    {
      id: 2,
      name: 'Albania',
    },
    {
      id: 3,
      name: 'Algeria',
    },
  ],
  status: 200,
  statusText: 'OK',
}
                              `}
                                </CodeBlock>
                              </Tabs.Panel>
                            )
                          })}
                      </Tabs>
                    )}
                  </div>
                </div>
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

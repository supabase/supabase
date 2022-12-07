import fs from 'fs'
import matter from 'gray-matter'
import { getAllDocs, getDocsBySlug } from '~/lib/docs'
import specFile from '~/../../spec/transforms/api_v0_openapi_deparsed.json' assert { type: 'json' }
import { gen_v3, enrichedOperation } from '~/lib/refGenerator/helpers'
import { Tabs } from '~/../../packages/ui'
import components from '~/components/index'
import { MDXRemote } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'

// @ts-ignore
import CodeBlock from '~/components/CodeBlock/CodeBlock'
import RefSubLayout from '~/layouts/ref/RefSubLayout'

export type AcceptedValue = {
  id: string
  name: string
  type: 'string' | 'boolean' | 'object'
  description?: string
}

export type Flag = {
  id: string
  name: string
  description: string
  default_value: string
  accepted_values: AcceptedValue[]
}

export type ApiParameter = {
  example: string
  in: string
  name: string
  required: boolean
  schema: {
    type: string
    example: string
  }
}
// @ts-ignore
const generatedSpec = gen_v3(specFile, 'wat', { apiUrl: 'apiv0' })

//console.log({ generatedSpec })
export default function Config(props) {
  return (
    <>
      <RefSubLayout>
        {props.docs
          .filter((doc) => doc.introPage)
          .map((item) => (
            <RefSubLayout.Section
              key={item.id}
              title={item.meta.title}
              id={item.id}
              slug={item.id}
              scrollSpyHeader={true}
              singleColumn={true}
            >
              <MDXRemote {...item.content} components={components} />
            </RefSubLayout.Section>
          ))}
      </RefSubLayout>
      <hr />
      <RefSubLayout>
        <div className="flex">
          <div className="w-full">
            <div className="grid gap-16">
              <h1 className="text-4xl">{generatedSpec.info.title}</h1>
              <p>{generatedSpec.info.description}</p>
            </div>

            <div className="grid gap-32 mx-auto max-w-5xl mt-24">
              {generatedSpec.sections.map((section) => (
                <>
                  <h2 className="text-3xl">{section.title}</h2>
                  {section.operations.map((operation: any) => (
                    <div className="border-b pb-8">
                      <RefSubLayout.Section
                        slug={operation.id}
                        title={operation.summary}
                        id={operation.operationId}
                        monoFont={false}
                      >
                        <RefSubLayout.Details>
                          <div className="mt-4">
                            <code className="text-md flex gap-4 text-md text-scale-900 break-all">
                              <span className="uppercase whitespace-nowrap	">
                                {operation.operation}
                              </span>
                              {operation.fullPath}
                            </code>
                          </div>
                          {/* Path Parameters */}
                          {operation.parameters &&
                            operation.parameters.filter((parameter) => parameter.in === 'path')
                              .length > 0 && (
                              <div className="mt-12">
                                <h2 className="border-b pb-2 text-xl">Path parameters</h2>
                                <ul className="mt-4">
                                  {operation.parameters &&
                                    operation.parameters
                                      .filter((parameter: any) => parameter.in === 'path')
                                      .map((parameter: any) => (
                                        <li className="mt-8 border-b pb-6">
                                          <div>
                                            <div className="flex gap-4 items-center">
                                              <span className="font-bold">{parameter.name}</span>
                                              <div className="font-mono text-xs break-all">
                                                {parameter.required && (
                                                  <div className="text-[10px] border border-amber-700 bg-amber-300 text-amber-900 px-2 tracking-wide font-mono py-0.25 rounded-full">
                                                    REQUIRED
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                            <p className="mt-4">{parameter.description}</p>
                                          </div>
                                          {parameter.example && (
                                            <div className="mt-4 flex gap-4 items-center">
                                              <span>Example:</span>
                                              <span className="font-mono text-xs break-all">
                                                {parameter.example}
                                              </span>
                                            </div>
                                          )}
                                        </li>
                                      ))}
                                </ul>
                              </div>
                            )}

                          {/* Header Parameters */}
                          {operation.parameters &&
                            operation.parameters.filter((parameter) => parameter.in === 'header')
                              .length > 0 && (
                              <div className="mt-12">
                                <h2 className="border-b pb-2 text-xl">Header parameters</h2>
                                <ul className="mt-4">
                                  {operation.parameters &&
                                    operation.parameters
                                      .filter((parameter: any) => parameter.in === 'header')
                                      .map((parameter: any) => (
                                        <li className="mt-8 border-b pb-6">
                                          <div className="flex gap-4 items-center">
                                            <span className="font-bold">{parameter.name}</span>
                                            <span className="font-mono text-xs break-all">
                                              {parameter.required && 'required'}
                                            </span>
                                          </div>
                                          <div className="mt-4 flex gap-4 items-center">
                                            <span>Example:</span>
                                            <span className="font-mono text-xs break-all">
                                              {parameter.example}
                                            </span>
                                          </div>
                                        </li>
                                      ))}
                                </ul>
                              </div>
                            )}
                        </RefSubLayout.Details>
                        <RefSubLayout.Examples>
                          <h2 className="text-xl">Responses</h2>
                          <Tabs
                            scrollable
                            size="small"
                            type="underlined"
                            defaultActiveId={operation.responseList[0].responseCode}
                          >
                            {operation.responseList.map((response: any) => (
                              <Tabs.Panel id={response.responseCode} label={response.responseCode}>
                                <p>{response.description}</p>
                                {response?.content && response?.content['application/json'] && (
                                  <div className="mt-8">
                                    <CodeBlock language="bash" className="relative">
                                      {JSON.stringify(
                                        response.content['application/json'],
                                        null,
                                        2
                                      )}
                                    </CodeBlock>
                                  </div>
                                )}
                              </Tabs.Panel>
                            ))}
                          </Tabs>
                        </RefSubLayout.Examples>
                      </RefSubLayout.Section>
                    </div>
                  ))}
                </>
              ))}
            </div>
          </div>
        </div>
      </RefSubLayout>
    </>
  )
}

export async function getStaticProps({ params }: { params: { slug: string[] } }) {
  // an array of ids of the intro sections for this library
  const introPages = ['api']
  const specPpages = generatedSpec.sections

  const pages = [...introPages, ...specPpages]

  /**
   * Read all the markdown files that might have
   *  - custom text
   *  - call outs
   *  - important notes regarding implementation
   */
  const allMarkdownDocs = await Promise.all(
    pages.map(async (x, i) => {
      const pathName = `docs/ref/api/${x}.mdx`

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
        introPage: introPages.includes(x),
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
    slug = `docs/reference/cli/${params.slug.join('/')}`
  } else {
    slug = `docs/reference/cli/${params.slug[0]}`
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

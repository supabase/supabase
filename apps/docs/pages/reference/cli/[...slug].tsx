import fs from 'fs'
import matter from 'gray-matter'
// @ts-expect-error
import cliSpec from '~/../../spec/cli_v1_commands_new_shape.yaml' assert { type: 'yml' }
import CodeBlock from '~/components/CodeBlock/CodeBlock'
import Options from '~/components/Options'
import Param from '~/components/Params'
import RefSubLayout from '~/layouts/ref/RefSubLayout'
import { getAllDocs, getDocsBySlug } from '~/lib/docs'

import toc from 'markdown-toc'
import { serialize } from 'next-mdx-remote/serialize'

import components from '~/components/index'
import { MDXRemote } from 'next-mdx-remote'
import OldLayout from '~/layouts/Default'

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

export type Command = {
  id: string
  title: string
  description: string
  flags?: Flag[]
  summary: string
  tags?: []
  links?: []
  subcommands?: []
  usage?: string
}

export default function Config(props) {
  console.log(props.docs)
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

  return (
    <>
      {console.log(props.docs.filter((doc) => doc.introPage))}
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
              <h1 className="text-4xl">{cliSpec.info.title}</h1>
              <p className="">{cliSpec.info.description}</p>
            </div>

            <div className="grid gap-32 mx-auto max-w-5xl mt-24">
              {cliSpec.commands.map((command: Command, commandIndex) => {
                return (
                  <RefSubLayout.Section
                    slug={command.id}
                    title={'$ ' + command.title}
                    id={command.id}
                    monoFont={true}
                    scrollSpyHeader={false}
                  >
                    <RefSubLayout.Details>
                      <div className="grid ref-container" id={command.id}>
                        <div className="border-b pb-8" key={command.id}>
                          <header
                            className={[
                              // 'border-b sticky top-16 z-10',
                              ' mb-16',
                            ].join(' ')}
                          >
                            <p className="capitalize mb-4 scroll-mt-16 mt-0 text-scale-1100 text-base">
                              {command.summary}
                            </p>
                          </header>

                          {/* {command.usage && (
                          <CodeBlock language="bash" className="relative">
                            {command.usage}
                          </CodeBlock>
                        )} */}

                          {command.subcommands.length > 0 && (
                            <div className="">
                              <h3 className="text-sm font-bold text-scale-1200 mb-3">
                                Available Commands
                              </h3>
                              <ul>
                                {command.subcommands.map((subcommand) => (
                                  <li key={subcommand}>
                                    <a href={`#${subcommand}`}>
                                      <CodeBlock language="bash">{subcommand}</CodeBlock>
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {command.flags.length > 0 && (
                            <>
                              <h3 className="text-lg text-scale-1200 mb-3">Flags</h3>
                              <ul className="">
                                {command.flags.map((flag: Flag) => (
                                  <>
                                    <li className="mt-0">
                                      <Param {...flag}>
                                        {flag?.accepted_values && (
                                          <Options>
                                            {flag?.accepted_values.map((value) => {
                                              return <Options.Option {...value} />
                                            })}
                                          </Options>
                                        )}
                                      </Param>
                                    </li>
                                  </>
                                ))}
                              </ul>
                            </>
                          )}
                        </div>
                      </div>
                    </RefSubLayout.Details>
                    <RefSubLayout.Examples>
                      {command.usage && (
                        <CodeBlock language="bash" className="relative">
                          {command.usage}
                        </CodeBlock>
                      )}
                    </RefSubLayout.Examples>
                  </RefSubLayout.Section>
                )
              })}
            </div>
          </div>
        </div>
      </RefSubLayout>
    </>
  )
}

export async function getStaticProps({ params }: { params: { slug: string[] } }) {
  // an array of ids of the intro sections for this library
  const introPages = ['cli', 'release-notes']
  const specPpages = cliSpec.commands

  const pages = [...introPages, ...specPpages]

  /**
   * Read all the markdown files that might have
   *  - custom text
   *  - call outs
   *  - important notes regarding implementation
   */
  const allMarkdownDocs = await Promise.all(
    pages.map(async (x, i) => {
      const pathName = `docs/ref/cli/${x}.mdx`

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

import ReactMarkdown from 'react-markdown'

import { IconDatabase, Tabs } from 'ui'
import CodeBlock from '~/components/CodeBlock/CodeBlock'

import Options from '~/components/Options'
import Param from '~/components/Params'
import RefSubLayout from '~/layouts/ref/RefSubLayout'
import { extractTsDocNode, generateParameters } from '~/lib/refGenerator/helpers'

import RefDetailCollapse from '~/components/reference/RefDetailCollapse'
import { Fragment } from 'react'

interface ICommonFunc {
  id: string
  title: string
  slug: string
  product: string
  libs: string
  items: ICommonFunc[]
}

interface IRefFunctionSection {
  funcData: any
  commonFuncData: ICommonFunc
  spec: any
  typeSpec?: any
}

const RefFunctionSection: React.FC<IRefFunctionSection> = (props) => {
  const item = props.spec.functions.find((x: any) => x.id === props.funcData.id)

  // gracefully return nothing if function does not exist
  if (!item) return <></>

  const hasTsRef = item['$ref'] || null

  const tsDefinition =
    hasTsRef && props.typeSpec ? extractTsDocNode(hasTsRef, props.typeSpec) : null
  const parameters = hasTsRef && tsDefinition ? generateParameters(tsDefinition) : ''
  const shortText = hasTsRef && tsDefinition ? tsDefinition.signatures[0].comment.shortText : ''

  return (
    <>
      <RefSubLayout.Section
        key={item.id}
        title={`${props.commonFuncData.title}`}
        id={item.id}
        slug={props.commonFuncData.slug}
        scrollSpyHeader={true}
      >
        <RefSubLayout.Details>
          <>
            <header className={['prose'].join(' ')}>
              {shortText && <ReactMarkdown className="text-sm">{shortText}</ReactMarkdown>}
            </header>

            {item.description && (
              <div className="prose">
                <ReactMarkdown className="text-sm">{item.description}</ReactMarkdown>
              </div>
            )}
            {/* {functionMarkdownContent && (
                        <div className="prose">
                          <MDXRemote {...functionMarkdownContent} components={components} />
                        </div>
                      )} */}
            {item.notes && (
              <div className="prose">
                <ReactMarkdown className="text-sm">{item.notes}</ReactMarkdown>
              </div>
            )}
            {/* // parameters */}
            {parameters && (
              <div className="not-prose mt-12">
                <h5 className="mb-3 text-base text-scale-1200">Parameters</h5>
                <ul className="">
                  {parameters.map((param) => {
                    // grab override params from yaml file
                    const overrideParams = item.overrideParams

                    // params from the yaml file can override the params from parameters if it matches the name
                    const overide = overrideParams?.filter((x) => {
                      return param.name === x.name
                    })

                    const paramItem = overide?.length > 0 ? overide[0] : param
                    return (
                      <Param {...paramItem} key={param.name}>
                        {paramItem.subContent && (
                          <div className="mt-3">
                            <Options>
                              {param.subContent.map((param) => {
                                return (
                                  <Fragment key={param.name + 'subcontent'}>
                                    <Options.Option {...param}>
                                      {param.subContent && (
                                        <Options>
                                          {param.subContent.map((param) => {
                                            return (
                                              <Options.Option
                                                {...param}
                                                key={param.name + 'subcontent-option'}
                                              />
                                            )
                                          })}
                                        </Options>
                                      )}
                                    </Options.Option>
                                  </Fragment>
                                )
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
          {item.examples && (
            <>
              <div className="overflow-hidden w-full">
                <Tabs
                  defaultActiveId={item.examples[0].id}
                  size="tiny"
                  type="rounded-pills"
                  scrollable
                >
                  {item.examples &&
                    item.examples.map((example, exampleIndex) => {
                      const exampleString = ''
                      //                     `
                      // import { createClient } from '@supabase/supabase-js'

                      // // Create a single supabase client for interacting with your database
                      // const supabase = createClient('https://xyzcompany.supabase.co', 'public-anon-key')
                      // `
                      const currentExampleId = example.id
                      const staticExample = item.examples[exampleIndex]

                      const response = staticExample.response
                      const sql = staticExample?.data?.sql
                      const tables = staticExample?.data?.tables

                      return (
                        <Tabs.Panel
                          id={example.id}
                          key={example.id}
                          label={example.name}
                          className="flex flex-col gap-3"
                        >
                          {((tables && tables.length > 0) || sql) && (
                            <RefDetailCollapse
                              id={`${example.id}-${exampleIndex}-data`}
                              label="Example data source"
                              defaultOpen={false}
                            >
                              <>
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
                                      </div>
                                    )
                                  })}
                                {sql && (
                                  <CodeBlock
                                    className="useless-code-block-class my-0 border border-t-0 border-scale-500 !rounded-tl-none !rounded-tr-none"
                                    language="sql"
                                    hideLineNumbers={true}
                                  >
                                    {sql.replace(/sql/g, '').replace(/```/g, '')}
                                  </CodeBlock>
                                )}
                              </>
                            </RefDetailCollapse>
                          )}

                          <CodeBlock
                            className="useless-code-block-class"
                            language="js"
                            hideLineNumbers={true}
                          >
                            {exampleString +
                              (example.code &&
                                example.code
                                  .replace(/```/g, '')
                                  .replace('js', '')
                                  .replace('ts', ''))}
                          </CodeBlock>
                          {response && (
                            <RefDetailCollapse
                              id={`${example.id}-${exampleIndex}-response`}
                              label="Example response"
                              defaultOpen={false}
                            >
                              <CodeBlock
                                className="useless-code-block-class"
                                language="js"
                                hideLineNumbers={true}
                              >
                                {response.replace(/```/g, '').replace('json', '')}
                              </CodeBlock>
                            </RefDetailCollapse>
                          )}
                        </Tabs.Panel>
                      )
                    })}
                </Tabs>
              </div>
            </>
          )}
        </RefSubLayout.Examples>
      </RefSubLayout.Section>
    </>
  )
}

export default RefFunctionSection

import ReactMarkdown from 'react-markdown'

import { Tabs } from 'ui'

import Options from '~/components/Options'
import Param from '~/components/Params'
import RefSubLayout from '~/layouts/ref/RefSubLayout'
import { extractTsDocNode, generateParameters } from '~/lib/refGenerator/helpers'

import { Fragment } from 'react'
import RefDetailCollapse from '~/components/reference/RefDetailCollapse'
import { IRefFunctionSection } from './Reference.types'

// codehike

import { MDXRemote } from 'next-mdx-remote'
import components from '~/components'

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
          {props.markdownData.examples && props.markdownData.examples.length > 0 && (
            <>
              <div className="overflow-hidden w-full remove-ch-codeblock-margin">
                <Tabs
                  defaultActiveId={props.markdownData?.examples[0]?.id}
                  size="tiny"
                  type="rounded-pills"
                  scrollable
                >
                  {props.markdownData.examples.map((example, exampleIndex) => {
                    return (
                      <Tabs.Panel
                        id={example.id}
                        key={example.id}
                        label={example.name}
                        className="flex flex-col gap-3"
                      >
                        {example.code && <MDXRemote {...example.code} components={components} />}

                        {example.data.sql && (
                          <RefDetailCollapse
                            id={`${example.id}-${exampleIndex}-data`}
                            label="Data source"
                            defaultOpen={false}
                          >
                            <MDXRemote {...example.data.sql} components={components} />
                          </RefDetailCollapse>
                        )}

                        {example.response && (
                          <RefDetailCollapse
                            id={`${example.id}-${exampleIndex}-response`}
                            label="Response"
                            defaultOpen={false}
                          >
                            <MDXRemote {...example.response} components={components} />
                          </RefDetailCollapse>
                        )}

                        {example.description && (
                          <RefDetailCollapse
                            id={`${example.id}-${exampleIndex}-notes`}
                            label="Notes"
                            defaultOpen={false}
                          >
                            <div className="bg-scale-300 border border-scale-500 rounded !rounded-tl-none !rounded-tr-none prose max-w-none px-5 py-2">
                              <ReactMarkdown className="text-sm">
                                {example.description}
                              </ReactMarkdown>
                            </div>
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

import ReactMarkdown from 'react-markdown'

import { CodeBlock, IconDatabase, Tabs } from 'ui'

import Options from '~/components/Options'
import Param from '~/components/Params'
import RefSubLayout from '~/layouts/ref/RefSubLayout'
import { extractTsDocNode, generateParameters } from '~/lib/refGenerator/helpers'

import RefDetailCollapse from '~/components/reference/RefDetailCollapse'
import { Fragment } from 'react'
import { IRefFunctionSection } from './Reference.types'
import components from '~/components'

const RefFunctionSection: React.FC<IRefFunctionSection> = (props) => {
  const item = props.spec.functions.find((x: any) => x.id === props.funcData.id)

  // gracefully return nothing if function does not exist
  if (!item) return <></>

  const hasTsRef = item['$ref'] || null

  const tsDefinition =
    hasTsRef && props.typeSpec ? extractTsDocNode(hasTsRef, props.typeSpec) : null
  const parameters = hasTsRef && tsDefinition ? generateParameters(tsDefinition) : item.params
  const shortText = hasTsRef && tsDefinition ? tsDefinition.signatures[0].comment?.shortText : ''

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
                <ReactMarkdown className="text-sm" components={components}>
                  {item.notes}
                </ReactMarkdown>
              </div>
            )}
            {/* parameters */}
            {parameters && (
              <div className="not-prose mt-12">
                <h5 className="mb-3 text-base text-foreground">Parameters</h5>
                <ul>
                  {parameters.map((param) => {
                    return (
                      <Param {...param} key={param.name}>
                        {param.subContent && (
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
                  queryGroup="example"
                >
                  {item.examples &&
                    item.examples.map((example, exampleIndex) => {
                      const exampleString =
                        '' +
                        (example.code &&
                          example.code
                            .trim()
                            .replace(/^```.*/, '')
                            .replace(/```$/, ''))

                      const codeBlockLang = example?.code?.startsWith('```js')
                        ? 'js'
                        : example?.code?.startsWith('```ts')
                          ? 'ts'
                          : example?.code?.startsWith('```dart')
                            ? 'dart'
                            : example?.code?.startsWith('```c#')
                              ? 'csharp'
                              : example?.code?.startsWith('```kotlin')
                                ? 'kotlin'
                                : 'js'
                      //                     `
                      // import { createClient } from '@supabase/supabase-js'

                      // // Create a single supabase client for interacting with your database
                      // const supabase = createClient('https://xyzcompany.supabase.co', 'public-anon-key')
                      // `
                      const staticExample = item.examples[exampleIndex]

                      const response = staticExample.response
                      const sql = staticExample?.data?.sql
                      const tables = staticExample?.data?.tables

                      return (
                        <Tabs.Panel
                          id={example.id}
                          key={exampleIndex}
                          label={example.name}
                          className="flex flex-col gap-3"
                        >
                          <CodeBlock
                            className="useless-code-block-class"
                            language={codeBlockLang}
                            hideLineNumbers={true}
                          >
                            {exampleString}
                          </CodeBlock>

                          {((tables && tables.length > 0) || sql) && (
                            <RefDetailCollapse
                              id={`${example.id}-${exampleIndex}-data`}
                              label="Data source"
                              defaultOpen={false}
                            >
                              <>
                                {tables &&
                                  tables.length > 0 &&
                                  tables.map((table) => {
                                    return (
                                      <div className="bg-surface-100 border rounded prose max-w-none">
                                        <div className="bg-background px-5 py-2">
                                          <div className="flex gap-2 items-center">
                                            <div className="text-brand">
                                              <IconDatabase size={16} />
                                            </div>
                                            <h5 className="text-xs text-foreground">
                                              {table.name}
                                            </h5>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                {sql && (
                                  <CodeBlock
                                    className="useless-code-block-class my-0 border border-t-0 border-default !rounded-tl-none !rounded-tr-none"
                                    language="sql"
                                    hideLineNumbers={true}
                                  >
                                    {sql.replace(/sql/g, '').replace(/```/g, '')}
                                  </CodeBlock>
                                )}
                              </>
                            </RefDetailCollapse>
                          )}

                          {response && (
                            <RefDetailCollapse
                              id={`${example.id}-${exampleIndex}-response`}
                              label="Response"
                              defaultOpen={false}
                            >
                              <CodeBlock
                                className="useless-code-block-class rounded !rounded-tl-none !rounded-tr-none border border-default"
                                language={codeBlockLang}
                                hideLineNumbers={true}
                              >
                                {response.replace(/```/g, '').replace('json', '')}
                              </CodeBlock>
                            </RefDetailCollapse>
                          )}

                          {example.description && (
                            <RefDetailCollapse
                              id={`${example.id}-${exampleIndex}-notes`}
                              label="Notes"
                              defaultOpen={false}
                            >
                              <div className="bg-surface-100 border border-default rounded !rounded-tl-none !rounded-tr-none prose max-w-none px-5 py-2">
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

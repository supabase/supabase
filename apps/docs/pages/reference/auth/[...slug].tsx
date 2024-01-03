import { CodeBlock, Tabs } from 'ui'
import specFile from '~/spec/transforms/auth_v1_openapi_deparsed.json' assert { type: 'json' }
import { gen_v3 } from '~/lib/refGenerator/helpers'

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

export default function Config() {
  return (
    <RefSubLayout>
      <div className="flex my-16">
        <div className="w-full">
          <div className="grid gap-16">
            <h1 className="text-4xl uppercase">{generatedSpec.info.title}</h1>
            <p>{generatedSpec.info.description}</p>
          </div>

          <div className="grid gap-32 mx-auto max-w-5xl mt-24">
            {generatedSpec.operations.map((operation: any) => (
              <div className="border-b pb-8">
                <RefSubLayout.Section
                  slug={operation.id}
                  title={operation.summary}
                  id={operation.operationId}
                  monoFont={false}
                >
                  <RefSubLayout.Details>
                    <div className="mt-4">
                      <code className="text-md flex gap-4 text-md text-foreground-lighter break-all">
                        <span className="uppercase whitespace-nowrap	">{operation.operation}</span>
                        {operation.fullPath}
                      </code>
                    </div>
                    {/* Path Parameters */}
                    {operation.parameters &&
                      operation.parameters.filter((parameter) => parameter.in === 'path').length >
                        0 && (
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
                      operation.parameters.filter((parameter) => parameter.in === 'header').length >
                        0 && (
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
                    {operation.responseList.length > 0 && (
                      <>
                        <h2 className="text-xl">Responses</h2>
                        <Tabs
                          scrollable
                          size="small"
                          type="underlined"
                          defaultActiveId={
                            operation.responseList[0].responseCode ??
                            operation.responseList[0].responseCode
                          }
                          queryGroup="response-status"
                        >
                          {operation.responseList.map((response: any) => (
                            <Tabs.Panel id={response.responseCode} label={response.responseCode}>
                              <p>{response.description}</p>
                              {response?.content && response?.content['application/json'] && (
                                <div className="mt-8">
                                  <CodeBlock language="bash" className="relative">
                                    {JSON.stringify(response.content['application/json'], null, 2)}
                                  </CodeBlock>
                                </div>
                              )}
                            </Tabs.Panel>
                          ))}
                        </Tabs>
                      </>
                    )}
                  </RefSubLayout.Examples>
                </RefSubLayout.Section>
              </div>
            ))}
          </div>
        </div>
      </div>
    </RefSubLayout>
  )
}

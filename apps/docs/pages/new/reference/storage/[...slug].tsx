import specFile from '~/../../spec/api_v0_openapi.json' assert { type: 'json' }
import { gen_v3, enrichedOperation } from '~/lib/refGenerator/helpers'
import { Tabs } from '~/../../packages/ui'
// @ts-ignore
import CodeBlock from '~/components/CodeBlock/CodeBlock'
import Options from '~/components/Options'
import Param from '~/components/Params'
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
console.log('zans', generatedSpec)
export default function Config() {
  return (
    <RefSubLayout>
      <div className="flex my-16">
        <div className="w-full">
          <div className="grid gap-16">
            <h1 className="text-4xl">{generatedSpec.info.title}</h1>
            <p>{generatedSpec.info.description}</p>
          </div>

          <div className="grid gap-32 mx-auto max-w-5xl mt-24">
            {generatedSpec.sections.map((section) => {
              return (
                <RefSubLayout.Section title={section.title} id={section.id} monoFont={false}>
                  <RefSubLayout.Details>
                    <div className="grid ref-container" id={section.id}>
                      <div className="border-b pb-8" key={section.id}>
                        <p>{section.description}</p>
                        <div>
                          {section.operations.map((operation: enrichedOperation) => (
                            <>
                              <div className="my-8">
                                <p className="text-xl">{operation.summary}</p>
                                <div className="mt-4">
                                  <code className="text-md flex gap-4 text-md text-scale-900">
                                    <span className="uppercase">{operation.operation}</span>
                                    {operation.fullPath}
                                  </code>
                                </div>
                                <div className="mt-12">
                                  <h2 className="border-b pb-2 text-xl">Path parameters</h2>
                                  <ul className="mt-4">
                                    {operation.parameters &&
                                      operation.parameters
                                        .filter((parameter) => parameter.in === 'path')
                                        .map((parameter: ApiParameter) => (
                                          <li className="mt-8 border-b pb-6">
                                            <div className="flex gap-4 items-center">
                                              <span className="font-bold">{parameter.name}</span>
                                              <span className="font-mono text-xs">
                                                {parameter.required && 'required'}
                                              </span>
                                            </div>
                                            <div className="mt-4 flex gap-4 items-center">
                                              <span>Example:</span>
                                              <span className="font-mono text-xs">
                                                {parameter.example}
                                              </span>
                                            </div>
                                          </li>
                                        ))}
                                  </ul>
                                </div>

                                <div className="mt-12">
                                  <h2 className="border-b pb-2 text-xl">Header parameters</h2>
                                  <ul className="mt-4">
                                    {operation.parameters &&
                                      operation.parameters
                                        .filter((parameter) => parameter.in === 'header')
                                        .map((parameter: ApiParameter) => (
                                          <li className="mt-8 border-b pb-6">
                                            <div className="flex gap-4 items-center">
                                              <span className="font-bold">{parameter.name}</span>
                                              <span className="font-mono text-xs">
                                                {parameter.required && 'required'}
                                              </span>
                                            </div>
                                            <div className="mt-4 flex gap-4 items-center">
                                              <span>Example:</span>
                                              <span className="font-mono text-xs">
                                                {parameter.example}
                                              </span>
                                            </div>
                                          </li>
                                        ))}
                                  </ul>
                                </div>
                              </div>

                              <h2 className="text-xl">Responses</h2>
                              <Tabs
                                scrollable
                                size="small"
                                type="underlined"
                                defaultActiveId={operation.responseList[0].responseCode}
                              >
                                {operation.responseList.map((response) => (
                                  <Tabs.Panel
                                    id={response.responseCode}
                                    label={response.responseCode}
                                  >
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
                            </>
                          ))}
                        </div>
                      </div>
                    </div>
                  </RefSubLayout.Details>

                  <RefSubLayout.Examples>right side</RefSubLayout.Examples>
                </RefSubLayout.Section>
              )
            })}
          </div>
        </div>
      </div>
    </RefSubLayout>
  )
}

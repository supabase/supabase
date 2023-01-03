import { Tabs } from '~/../../packages/ui'
import CodeBlock from '~/components/CodeBlock/CodeBlock'
import Param from '~/components/Params'
import RefSubLayout from '~/layouts/ref/RefSubLayout'

const ApiOperationSection = (props) => {
  const operation = props.spec.operations.find((x: any) => x.operationId === props.funcData.id)

  // gracefully return nothing if function does not exist
  if (!operation) return <></>

  return (
    <RefSubLayout.Section
      key={operation.operationId}
      slug={operation.operationId}
      title={operation.summary}
      id={operation.operationId}
      scrollSpyHeader={true}
      monoFont={false}
    >
      <RefSubLayout.Details>
        <div className="mt-4">
          <code className="text-md flex gap-4 text-md text-scale-900 break-all">
            <span
              className="
                uppercase 
                whitespace-nowrap 
                bg-scale-1200 text-scale-100 
                flex items-center justify-center 
                rounded-full font-mono font-medium text-xs px-2 py-0.5"
            >
              {operation.operation}
            </span>
            {operation.path}
          </code>
        </div>
        <div className="prose dark:prose-dark py-4">
          <p>{operation.description}</p>
        </div>
        {/* Path Parameters */}
        {operation.parameters &&
          operation.parameters.filter((parameter) => parameter.in === 'path').length > 0 && (
            <div className="not-prose mt-12">
              <h5 className="mb-3 text-base text-scale-1200">Path Parameters</h5>
              <ul className="mt-4">
                {operation.parameters &&
                  operation.parameters
                    .filter((parameter: any) => parameter.in === 'path')
                    .map((parameter: any) => (
                      <Param {...parameter} isOptional={!parameter.required}></Param>
                    ))}
              </ul>
            </div>
          )}

        {/* Query Parameters */}
        {operation.parameters &&
          operation.parameters.filter((parameter) => parameter.in === 'query').length > 0 && (
            <div className="not-prose mt-12">
              <h5 className="mb-3 text-base text-scale-1200">Query Parameters</h5>
              <ul className="mt-4">
                {operation.parameters &&
                  operation.parameters
                    .filter((parameter: any) => parameter.in === 'query')
                    .map((parameter: any) => (
                      <Param {...parameter} isOptional={!parameter.required}></Param>
                    ))}
              </ul>
            </div>
          )}

        {/* Header Parameters */}
        {operation.parameters &&
          operation.parameters.filter((parameter) => parameter.in === 'header').length > 0 && (
            <div className="not-prose mt-12">
              <h5 className="mb-3 text-base text-scale-1200">Query Parameters</h5>
              <ul className="mt-4">
                {operation.parameters &&
                  operation.parameters
                    .filter((parameter: any) => parameter.in === 'header')
                    .map((parameter: any) => (
                      <Param {...parameter} isOptional={!parameter.required}></Param>
                    ))}
              </ul>
            </div>
          )}
      </RefSubLayout.Details>
      {operation.responseList && operation.responseList.length > 0 && (
        <RefSubLayout.Examples>
          <h5 className="mb-3 text-base text-scale-1200">Responses</h5>
          <Tabs
            scrollable
            size="small"
            type="underlined"
            defaultActiveId={operation.responseList[0].responseCode}
          >
            {operation.responseList.map((response: any) => (
              <Tabs.Panel id={response.responseCode} label={response.responseCode}>
                <p className="text-scale-1000">{response.description}</p>
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
        </RefSubLayout.Examples>
      )}
    </RefSubLayout.Section>
  )
}
export default ApiOperationSection

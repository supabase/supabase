import { CodeBlock } from '@ui/components/CodeBlock'
import { sample } from '@har-sdk/openapi-sampler'
import { Tabs, TabPanel } from '~/components/Tabs'

type IParamProps = any

const ApiSchema = ({ schema, id }: IParamProps) => {
  const example = sample(schema, { skipReadOnly: true, quiet: true })
  return (
    <Tabs
      scrollable
      size="small"
      type="underlined"
      defaultActiveId="example"
      queryGroup="response-status"
    >
      <TabPanel key={`${id}-example`} id="example" label="example">
        <div className="mt-8">
          <CodeBlock language="bash" className="relative">
            {JSON.stringify(example, null, 2)}
          </CodeBlock>
        </div>
      </TabPanel>
      <TabPanel key={`${id}-schema`} id="schema" label="schema">
        <div className="mt-8">
          <CodeBlock language="bash" className="relative">
            {JSON.stringify(schema, null, 2)}
          </CodeBlock>
        </div>
      </TabPanel>
    </Tabs>
  )
}

export default ApiSchema

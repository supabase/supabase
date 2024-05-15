import Options from '~/components/Options'
import { CodeBlock } from '@ui/components/CodeBlock'
import Param from '~/components/Params'

type IParamProps = any

const ApiBodyParam = ({ name, value, isOptional }: IParamProps) => {
  return (
    <Param
      key={name}
      name={name}
      type={
        (value as any).type === 'array'
          ? `array[${(value as any).items?.type}]`
          : (value as any).type
      }
      description={value.description}
      isOptional={isOptional}
    >
      {(value as any).enum && (
        <Options>
          {(value as any).enum.map((value) => {
            return <Options.Option key={value} name={value} isEnum={true} />
          })}
        </Options>
      )}
      {(value as any).type === 'object' && (
        <CodeBlock language="bash" className="relative">
          {JSON.stringify(value, null, 2)}
        </CodeBlock>
      )}
    </Param>
  )
}

export default ApiBodyParam

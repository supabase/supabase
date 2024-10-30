import Options from '~/components/Options'
import Param from '~/components/Params'
import ApiSchema from '~/components/ApiSchema'
import ApiSchemaOptions from '~/components/ApiSchemaOption'

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
        <ApiSchemaOptions>
          <div
            className="
              px-5 py-3 first:border-t border-b border-l border-r
              border-default
              last:rounded-bl-lg last:rounded-br-lg
              flex flex-col gap-3
            "
          >
            <ApiSchema id={name} schema={value}></ApiSchema>
          </div>
        </ApiSchemaOptions>
      )}
    </Param>
  )
}

export default ApiBodyParam

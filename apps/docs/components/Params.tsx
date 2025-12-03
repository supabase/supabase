import { ReactMarkdown } from 'react-markdown/lib/react-markdown'

import { Badge } from 'ui'

type IParamProps = any

/**
 * isPrimitive: Indicates whether the value is a basic type such as string or number. It does not refer to an object param.
 * */
const Param = ({ name, isOptional, type, description, children, isPrimitive }: IParamProps) => {
  return (
    <div className="border-t border-b py-5 flex flex-col gap-3 debugger">
      <div className="flex gap-3 items-center flex-wrap">
        {!isPrimitive && (
          <span className="text-sm text-foreground font-mono font-medium">{name ?? 'no-name'}</span>
        )}
        {isOptional ? (
          <Badge variant="default">Optional</Badge>
        ) : (
          <Badge variant="warning">Required</Badge>
        )}
        <span className="text-foreground-muted text-xs">{type ?? 'no type'}</span>
      </div>
      {description && (
        <ReactMarkdown className="text-sm text-foreground-lighter m-0">{description}</ReactMarkdown>
      )}
      {children}
    </div>
  )
}

export default Param

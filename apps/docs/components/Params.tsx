import { ReactMarkdown } from 'react-markdown/lib/react-markdown'

type IParamProps = any

const Param = ({ name, isOptional, type, description, children }: IParamProps) => {
  return (
    <div className="border-t border-b py-5 flex flex-col gap-3 debugger">
      <div className="flex gap-3 items-center">
        <span className="text-sm text-foreground font-mono font-medium">{name ?? 'no-name'}</span>
        <span>
          {isOptional ? (
            <div className="text-[10px] px-3 tracking-wide font-mono text-foreground-lighter">
              Optional
            </div>
          ) : (
            <div className="text-[10px] border border-amber-700 bg-amber-300 text-amber-900 px-2 tracking-wide font-mono py-0.25 rounded-full">
              REQUIRED
            </div>
          )}
        </span>
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

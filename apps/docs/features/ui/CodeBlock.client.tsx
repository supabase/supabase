import { type ThemedToken } from 'shiki'
import { type NodeHover } from 'twoslash'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

export function AnnotatedSpan({
  token,
  annotations,
}: {
  token: ThemedToken
  annotations: Array<NodeHover>
}) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <span style={token.htmlStyle}>{token.content}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[min(80vw,400px)] p-0 divide-y">
        {annotations.map((annotation, idx) => (
          <Annotation key={idx} annotation={annotation} />
        ))}
      </TooltipContent>
    </Tooltip>
  )
}

function Annotation({ annotation }: { annotation: NodeHover }) {
  const { text, docs, tags } = annotation
  return (
    <div className="flex flex-col gap-2">
      <code className={cn('block bg-200 p-2', (docs || tags) && 'border-b border-default')}>
        {text}
      </code>
      {docs && <p className={cn('p-2', tags && 'border-b border-default')}>{docs}</p>}
      {tags && (
        <div className="p-2 flex flex-col">
          {tags.map((tag, idx) => {
            return (
              <span key={idx}>
                <code>@{tag[0]}</code> {tag[1]}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

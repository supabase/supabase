import {
  Children,
  type DetailedHTMLProps,
  type HTMLAttributes,
  type PropsWithChildren,
} from 'react'
import { useQuery } from './hooks/queryHooks'

interface TextHighlighterProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement> {}

const TextHighlighter = ({ children, ...props }: PropsWithChildren<TextHighlighterProps>) => {
  const query = useQuery()

  const child = Children.toArray(children)[0]
  if (typeof child !== 'string') return child

  const idx = child.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) {
    return <span {...props}>{child}</span>
  }

  return (
    <span {...props}>
      {child.substring(0, idx)}
      <span className="text-foreground font-semibold">
        {child.substring(idx, idx + query.length)}
      </span>
      {child.substring(idx + query.length)}
    </span>
  )
}

export { TextHighlighter }

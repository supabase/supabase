'use client'

import {
  Children,
  type DetailedHTMLProps,
  type HTMLAttributes,
  type PropsWithChildren,
} from 'react'

import { useQuery } from './hooks/queryHooks'

interface TextHighlighterBaseProps
  extends PropsWithChildren<DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>> {
  query: string
  text?: string
}

function TextHighlighterBase({ children, text, query, ...props }: TextHighlighterBaseProps) {
  const child = text ?? Children.toArray(children)[0]
  if (typeof child !== 'string') return child

  const idx = child.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) {
    return <span {...props}>{child}</span>
  }

  return (
    <span {...props}>
      {child.substring(0, idx)}
      <span className="text-foreground">{child.substring(idx, idx + query.length)}</span>
      {child.substring(idx + query.length)}
    </span>
  )
}

function TextHighlighter(props: Omit<TextHighlighterBaseProps, 'query'>) {
  const query = useQuery()

  return <TextHighlighterBase query={query} {...props} />
}

export { TextHighlighter, TextHighlighterBase }

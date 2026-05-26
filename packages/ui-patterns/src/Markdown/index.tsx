'use client'

import React from 'react'
import ReactMarkdown, { type Components, type Options } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from 'ui'
import { Heading } from 'ui/src/components/CustomHTMLElements'

import {
  Anchor,
  Avatar,
  Blockquote,
  Code,
  CodeBlockPre,
  DefaultPre,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Hr,
  Img,
  InlineCode,
  ListItem,
  OrderedList,
  Paragraph,
  Quote,
  SimplePre,
  Table,
  Td,
  Th,
  Tr,
  UnorderedList,
} from './components'

const defaultComponents: Components = {
  h1: (props) => <Heading tag="h1" {...props} />,
  h2: (props) => <Heading tag="h2" {...props} />,
  h3: (props) => <Heading tag="h3" {...props} />,
  h4: (props) => <Heading tag="h4" {...props} />,
  h5: (props) => <Heading tag="h5" {...props} />,
  h6: (props) => <Heading tag="h6" {...props} />,
  p: Paragraph,
  a: Anchor,
  code: Code,
  img: Img,
  ul: UnorderedList,
  ol: OrderedList,
  li: ListItem,
  blockquote: Blockquote,
  hr: Hr,
  pre: DefaultPre,
  table: Table,
  tr: Tr,
  th: Th,
  td: Td,
}

interface MarkdownProps extends Omit<Options, 'children' | 'node' | 'components'> {
  children?: string
  className?: string
  codeBlock?: boolean
  /** @deprecated Use children instead */
  content?: string
  components?: Partial<Components> & Record<string, React.ComponentType<any>>
}

export function Markdown({
  children,
  content = '',
  codeBlock = false,
  components,
  className,
  remarkPlugins,
  ...props
}: MarkdownProps) {
  // Allow opting into code block syntax highlighting
  const mergedComponents = {
    ...defaultComponents,
    ...(codeBlock && { pre: CodeBlockPre }),
    ...components,
  }

  return (
    <div className={cn('text-sm', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, ...(remarkPlugins ?? [])]}
        components={mergedComponents}
        {...props}
      >
        {children ?? content}
      </ReactMarkdown>
    </div>
  )
}

export const markdownComponents = {
  mono: (props: any) => <code className="text-sm">{props.children}</code>,
  code: Code,
  img: Img,
}

export {
  Anchor,
  Avatar,
  Blockquote,
  Code,
  CodeBlockPre,
  DefaultPre,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Hr,
  Img,
  InlineCode,
  ListItem,
  OrderedList,
  Paragraph,
  Quote,
  SimplePre,
  Table,
  Td,
  Th,
  Tr,
  UnorderedList,
}

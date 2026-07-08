'use client'

import React from 'react'
import ReactMarkdown, { type Components, type Options } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from 'ui'
import { Heading } from 'ui/src/components/CustomHTMLElements'

import {
  Avatar,
  Blockquote,
  Code,
  CodeBlockPre,
  DefaultPre,
  Img,
  InlineCode,
  Quote,
  SimplePre,
} from './components'

const defaultComponents: Components = {
  h1: (props) => <Heading tag="h1" {...props} />,
  h2: (props) => <Heading tag="h2" {...props} />,
  h3: (props) => <Heading tag="h3" {...props} />,
  h4: (props) => <Heading tag="h4" {...props} />,
  h5: (props) => <Heading tag="h5" {...props} />,
  h6: (props) => <Heading tag="h6" {...props} />,
  code: Code,
  img: Img,
  blockquote: Blockquote,
  pre: DefaultPre,
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
    <div className={cn('prose max-w-none', className)}>
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

export { Avatar, Blockquote, Code, CodeBlockPre, DefaultPre, Img, InlineCode, Quote, SimplePre }

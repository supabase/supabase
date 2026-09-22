'use client'

import dynamic from 'next/dynamic'
import React, { isValidElement, type HTMLAttributes } from 'react'
import { cn } from 'ui'
import { type CodeBlockLang } from 'ui-patterns/CodeBlock'

const DynamicCodeBlock = dynamic(() =>
  import('../CodeBlock').then((m) => ({ default: m.CodeBlock }))
)

export const InlineCode = ({ className, ...props }: HTMLAttributes<HTMLElement>) => (
  <code className={cn('text-code-inline', className)} {...props} />
)

export const Blockquote = ({ className, ...props }: HTMLAttributes<HTMLElement>) => (
  <blockquote
    className={cn('mt-4 border-l-2 pl-6 italic text-foreground-light', className)}
    {...props}
  />
)

export const Img = ({
  className,
  alt = '',
  ...props
}: HTMLAttributes<HTMLImageElement> & { alt?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img className={cn('rounded-md border', className)} alt={alt} {...props} />
)

export const SimplePre = ({ className, ...props }: HTMLAttributes<HTMLPreElement>) => (
  <pre
    className={cn(
      'my-4 overflow-x-auto rounded-lg border bg-surface-75 py-4 px-4 text-sm text-foreground-light',
      className
    )}
    {...props}
  />
)

export const Code = ({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) => {
  // Code blocks have language-xxx class, pass through for pre handler to extract
  if (className?.startsWith('language-')) {
    return <code className={className}>{children}</code>
  }
  return <InlineCode>{children}</InlineCode>
}

export const DefaultPre = ({ children, ...props }: HTMLAttributes<HTMLPreElement>) => (
  <SimplePre {...props}>{children}</SimplePre>
)

export const CodeBlockPre = ({ children, ...props }: HTMLAttributes<HTMLPreElement>) => {
  // Find the code element inside pre
  const codeElement = React.Children.toArray(children).find(
    (child) => isValidElement(child) && child.type === 'code'
  )

  if (!isValidElement(codeElement)) {
    return <SimplePre {...props}>{children}</SimplePre>
  }

  const { className, children: code } = codeElement.props as {
    className?: string
    children: string
  }
  const language = className?.replace('language-', '') as CodeBlockLang
  const content = typeof code === 'string' ? code.trimEnd() : ''

  if (!language || !content) {
    return <SimplePre {...props}>{children}</SimplePre>
  }

  return (
    <DynamicCodeBlock
      value={content}
      language={language}
      hideLineNumbers={false}
      className="my-4"
    />
  )
}

export const Avatar = ({
  src,
  alt = 'Avatar',
  caption,
}: {
  src: string
  alt?: string
  caption?: string
}) => (
  <div className={cn('align-center m-0 flex items-center gap-3')}>
    <img src={src} alt={alt} className="h-8 w-8 rounded-full object-cover m-0" />
    {caption && (
      <figcaption className="text-foreground-lighter font-normal not-italic text-sm m-0">
        {caption}
      </figcaption>
    )}
  </div>
)

export const Quote = ({
  children,
  attribution,
  src,
  alt,
  caption,
  className,
  ...props
}: HTMLAttributes<HTMLQuoteElement> & {
  attribution?: string
  src?: string
  alt?: string
  caption?: string
}) => (
  <blockquote
    className={cn(
      'mt-4 border-l-2 pl-6 italic text-foreground-light [&>p]:my-0 [&>p:not(:last-child)]:mb-4',
      className
    )}
    {...props}
  >
    {children}
    {attribution && (
      <div className="mt-4 not-italic text-sm text-foreground">
        <div className="font-semibold">— {attribution}</div>
        {src && caption && <Avatar src={src} alt={alt} caption={caption} />}
      </div>
    )}
  </blockquote>
)

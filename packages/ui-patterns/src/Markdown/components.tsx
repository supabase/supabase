'use client'

import dynamic from 'next/dynamic'
import React, { isValidElement, type HTMLAttributes } from 'react'
import { cn } from 'ui'
import { type CodeBlockLang } from 'ui-patterns/CodeBlock'

const DynamicCodeBlock = dynamic(() =>
  import('../CodeBlock').then((m) => ({ default: m.CodeBlock }))
)

export const H1 = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h1 className={cn('font-heading mt-2 scroll-m-20 text-4xl font-bold', className)} {...props} />
)

export const H2 = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h2
    className={cn(
      'font-heading mt-12 scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight first:mt-0',
      className
    )}
    {...props}
  />
)

export const H3 = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn('font-heading mt-8 scroll-m-20 text-xl font-semibold tracking-tight', className)}
    {...props}
  />
)

export const H4 = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h4
    className={cn('font-heading mt-8 scroll-m-20 text-lg font-semibold tracking-tight', className)}
    {...props}
  />
)

export const H5 = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h5
    className={cn('mt-8 scroll-m-20 text-lg font-semibold tracking-tight', className)}
    {...props}
  />
)

export const H6 = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h6
    className={cn('mt-8 scroll-m-20 text-base font-semibold tracking-tight', className)}
    {...props}
  />
)

export const Paragraph = ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('leading-7 [&:not(:first-child)]:mt-6 text-foreground', className)} {...props} />
)

export const InlineCode = ({ className, ...props }: HTMLAttributes<HTMLElement>) => (
  <code className={cn('text-code-inline', className)} {...props} />
)

export const Anchor = ({
  href,
  className,
  ...props
}: HTMLAttributes<HTMLAnchorElement> & { href?: string }) => (
  <a
    href={href ?? '#'}
    className={cn(
      'underline decoration-1 decoration-foreground-muted underline-offset-4 transition-colors hover:decoration-foreground hover:decoration-2',
      className
    )}
    {...props}
  />
)

export const UnorderedList = ({ className, ...props }: HTMLAttributes<HTMLUListElement>) => (
  <ul className={cn('my-6 ml-6 list-disc text-foreground', className)} {...props} />
)

export const OrderedList = ({ className, ...props }: HTMLAttributes<HTMLOListElement>) => (
  <ol className={cn('my-6 ml-6 list-decimal text-foreground', className)} {...props} />
)

export const ListItem = ({ className, ...props }: HTMLAttributes<HTMLLIElement>) => (
  <li className={cn('mt-2', className)} {...props} />
)

export const Blockquote = ({ className, ...props }: HTMLAttributes<HTMLElement>) => (
  <blockquote
    className={cn('mt-4 border-l-2 pl-6 italic text-foreground-light', className)}
    {...props}
  />
)

export const Hr = ({ ...props }: HTMLAttributes<HTMLHRElement>) => (
  <hr className="my-4 md:my-8" {...props} />
)

export const Img = ({
  className,
  alt = '',
  ...props
}: HTMLAttributes<HTMLImageElement> & { alt?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img className={cn('rounded-md border', className)} alt={alt} {...props} />
)

export const Table = ({ className, ...props }: HTMLAttributes<HTMLTableElement>) => (
  <div className="my-6 w-full overflow-y-auto">
    <table className={cn('w-full', className)} {...props} />
  </div>
)

export const Tr = ({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn('m-0 border-t p-0 even:bg-surface-75/75', className)} {...props} />
)

export const Th = ({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn(
      'border px-4 py-2 text-left font-normal [[align=center]]:text-center [[align=right]]:text-right',
      className
    )}
    {...props}
  />
)

export const Td = ({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) => (
  <td
    className={cn(
      'border text-foreground-light px-4 py-2 text-left [[align=center]]:text-center [[align=right]]:text-right',
      className
    )}
    {...props}
  />
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

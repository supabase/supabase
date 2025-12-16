import { InlineLink } from 'components/ui/InlineLink'
import { PropsWithChildren } from 'react'
import { ReactMarkdown, ReactMarkdownOptions } from 'react-markdown/lib/react-markdown'
import remarkGfm from 'remark-gfm'

import { cn } from 'ui'

interface MarkdownProps extends Omit<ReactMarkdownOptions, 'children' | 'node'> {
  className?: string
  /** @deprecated  Should remove this and just take `children` instead */
  content?: string
  extLinks?: boolean
}

export const Markdown = ({
  children,
  className,
  content = '',
  extLinks = false,
  ...props
}: PropsWithChildren<MarkdownProps>) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h3: ({ children }) => <h3 className="mb-1">{children}</h3>,
        code: ({ children }) => <code className="text-code-inline">{children}</code>,
        a: ({ href, children }) => <InlineLink href={href ?? '/'}>{children}</InlineLink>,
      }}
      {...props}
      className={cn('text-sm', className)}
    >
      {(children as string) ?? content}
    </ReactMarkdown>
  )
}

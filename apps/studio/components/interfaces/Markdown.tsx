import { PropsWithChildren } from 'react'
import ReactMarkdown, { type Options } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from 'ui'

import { InlineLink } from '@/components/ui/InlineLink'

interface MarkdownProps extends Omit<Options, 'children' | 'node'> {
  className?: string
  /** @deprecated  Should remove this and just take `children` instead */
  content?: string
  extLinks?: boolean
}

const H3 = ({
  children,
}: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>) => (
  <h3 className="mb-1">{children}</h3>
)
const Code = ({
  children,
}: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>) => (
  <code className="text-code-inline">{children}</code>
)
const A = ({
  href,
  children,
}: React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>) => (
  <InlineLink href={href ?? '/'}>{children}</InlineLink>
)

export const Markdown = ({
  children,
  className,
  content = '',
  extLinks = false,
  ...props
}: PropsWithChildren<MarkdownProps>) => {
  return (
    <div className={cn('text-sm', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h3: H3,
          code: Code,
          a: A,
        }}
        {...props}
      >
        {(children as string) ?? content}
      </ReactMarkdown>
    </div>
  )
}

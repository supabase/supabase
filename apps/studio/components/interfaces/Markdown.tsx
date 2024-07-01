import { ReactMarkdown, ReactMarkdownOptions } from 'react-markdown/lib/react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from 'ui'

interface Props extends Omit<ReactMarkdownOptions, 'children' | 'node'> {
  className?: string
  content: string
  extLinks?: boolean
}

const Markdown = ({ className, content = '', extLinks = false, ...props }: Props) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h3: ({ children }) => <h3 className="mb-1">{children}</h3>,
        a: ({ href, children }) => (
          <a href={href} target={extLinks ? '_blank' : ''} rel={extLinks ? 'noreferrer' : ''}>
            {children}
          </a>
        ),
      }}
      {...props}
      className={cn('prose text-sm', className)}
    >
      {content}
    </ReactMarkdown>
  )
}

export { Markdown }

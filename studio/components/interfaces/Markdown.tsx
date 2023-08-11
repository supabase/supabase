import { ReactMarkdownProps } from 'react-markdown/lib/complex-types'
import { ReactMarkdown } from 'react-markdown/lib/react-markdown'
import { cn } from 'ui'

interface Props extends Omit<ReactMarkdownProps, 'children' | 'node'> {
  className?: string
  content: string
}

const Markdown = ({ className, content = '', ...props }: Props) => {
  return (
    <ReactMarkdown
      components={{ h3: ({ children }) => <h3 className="mb-1">{children}</h3> }}
      {...props}
      className={cn('prose text-sm', className)}
    >
      {content}
    </ReactMarkdown>
  )
}

export { Markdown }

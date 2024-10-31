import ReactMarkdown from 'react-markdown'

import { Markdown } from 'components/interfaces/Markdown'
import { ReactNode } from 'react'
import { cn } from 'ui'
import { DocsButton } from '../DocsButton'

const FormHeader = ({
  title,
  description,
  docsUrl,
  actions,
  className,
}: {
  title: string
  description?: string
  docsUrl?: string
  actions?: ReactNode
  className?: string
}) => {
  return (
    <div className={cn(`mb-6 flex items-center justify-between gap-x-4 ${className}`)}>
      <div className="space-y-1">
        <h3 className="text-foreground text-xl">
          <ReactMarkdown unwrapDisallowed disallowedElements={['p']}>
            {title}
          </ReactMarkdown>
        </h3>
        {description && <Markdown content={description} className="max-w-full" />}
      </div>
      <div className="flex items-center gap-x-2">
        {docsUrl !== undefined && <DocsButton href={docsUrl} />}
        {actions}
      </div>
    </div>
  )
}

export { FormHeader }

import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

import { Markdown } from 'components/interfaces/Markdown'
import { Button } from 'ui'
import { ReactNode } from 'react'

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
    <div className={`mb-6 flex items-center justify-between ${className}`}>
      <div className="space-y-1">
        <h3 className="text-foreground text-xl">
          <ReactMarkdown unwrapDisallowed disallowedElements={['p']}>
            {title}
          </ReactMarkdown>
        </h3>
        {description && <Markdown content={description} className="max-w-full" />}
      </div>
      <div className="flex items-center gap-x-2">
        {docsUrl !== undefined && (
          <Button asChild type="default" icon={<ExternalLink size={14} />}>
            <Link href={docsUrl} target="_blank" rel="noreferrer">
              Documentation
            </Link>
          </Button>
        )}
        {actions}
      </div>
    </div>
  )
}

export { FormHeader }

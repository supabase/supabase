import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

import { Markdown } from 'components/interfaces/Markdown'
import { Button } from 'ui'

const FormHeader = ({
  title,
  description,
  docsUrl,
  className,
}: {
  title: string
  description?: string
  docsUrl?: string
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
      {docsUrl !== undefined && (
        <Button asChild type="default" icon={<ExternalLink size={14} />}>
          <Link href={docsUrl} target="_blank" rel="noreferrer">
            Documentation
          </Link>
        </Button>
      )}
    </div>
  )
}

export { FormHeader }

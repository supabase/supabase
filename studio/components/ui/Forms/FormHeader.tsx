import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { Button, IconExternalLink } from 'ui'

const FormHeader = ({
  title,
  description,
  docsUrl,
}: {
  title: string
  description?: string
  docsUrl?: string
}) => {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="space-y-1">
        <h3 className="text-foreground text-xl">
          <ReactMarkdown unwrapDisallowed disallowedElements={['p']}>
            {title}
          </ReactMarkdown>
        </h3>
        {description && (
          <div className="text-foreground-lighter text-sm">
            <ReactMarkdown>{description}</ReactMarkdown>
          </div>
        )}
      </div>
      {docsUrl !== undefined && (
        <Button asChild type="default" icon={<IconExternalLink />}>
          <Link href={docsUrl} target="_blank" rel="noreferrer">
            Documentation
          </Link>
        </Button>
      )}
    </div>
  )
}

export { FormHeader }

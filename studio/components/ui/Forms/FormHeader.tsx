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
        <Link passHref href={docsUrl}>
          <Button asChild type="default" icon={<IconExternalLink />}>
            <a target="_blank" rel="noreferrer">
              Documentation
            </a>
          </Button>
        </Link>
      )}
    </div>
  )
}

export { FormHeader }

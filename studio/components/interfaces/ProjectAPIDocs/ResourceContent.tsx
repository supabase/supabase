import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'
import { Markdown } from '../Markdown'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useParams } from 'common'
import { PropsWithChildren } from 'react'
import Link from 'next/link'
import { Button, IconExternalLink } from 'ui'

interface ResourceContentProps {
  useServiceKey?: boolean
  selectedLanguage: 'js' | 'bash'
  snippet: {
    key: string
    title: string
    description?: string
    docsUrl?: string
  }
  codeSnippets: any[]
}

const ResourceContent = ({
  useServiceKey = false,
  selectedLanguage,
  snippet,
  codeSnippets,
}: ResourceContentProps) => {
  const { ref: projectRef } = useParams()
  const { data } = useProjectApiQuery({ projectRef })

  const apikey = useServiceKey ? 'SUPABASE_SERVICE_KEY' : 'SUPABASE_CLIENT_API_KEY'
  const endpoint = data?.autoApiService.endpoint ?? ''

  return (
    <div id={snippet.key} className="space-y-4 py-6">
      <div className="px-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="doc-heading">{snippet.title}</h2>
          {snippet.docsUrl !== undefined && (
            <Link passHref href={snippet.docsUrl}>
              <Button asChild type="default" icon={<IconExternalLink />}>
                <a target="_blank" rel="noreferrer">
                  Documentation
                </a>
              </Button>
            </Link>
          )}
        </div>
        {snippet.description !== undefined && (
          <div className="doc-section">
            <article className="text text-sm text-light">
              <Markdown
                className="max-w-none"
                content={snippet.description.replaceAll('[ref]', projectRef ?? '_')}
              />
            </article>
          </div>
        )}
      </div>
      {codeSnippets.map((codeSnippet) => (
        <div className="px-4 space-y-2">
          <p className="text-sm text-foreground-light">{codeSnippet.title}</p>
          <div className="codeblock-container">
            <div className="bg rounded p-2">
              <SimpleCodeBlock className={selectedLanguage}>
                {codeSnippet[selectedLanguage]}
              </SimpleCodeBlock>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
export default ResourceContent

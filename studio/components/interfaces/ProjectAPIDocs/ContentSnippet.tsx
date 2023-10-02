import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'
import { Markdown } from '../Markdown'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useParams } from 'common'
import { PropsWithChildren } from 'react'

interface ContentSnippetProps {
  useServiceKey?: boolean
  selectedLanguage: 'js' | 'bash'
  snippet: {
    key: string
    category: string
    title: string
    description?: string
    js?: (apikey?: string, endpoint?: string) => string
    bash?: (apikey?: string, endpoint?: string) => string
  }
}

const ContentSnippet = ({
  useServiceKey = false,
  selectedLanguage,
  snippet,
  children,
}: PropsWithChildren<ContentSnippetProps>) => {
  const { ref: projectRef } = useParams()
  const { data } = useProjectApiQuery({ projectRef })

  const apikey = useServiceKey ? 'SUPABASE_SERVICE_KEY' : 'SUPABASE_CLIENT_API_KEY'
  const endpoint = data?.autoApiService.endpoint ?? ''

  const codeSnippet = snippet[selectedLanguage]?.(apikey, endpoint)

  return (
    <div id={snippet.key} className="space-y-4 py-6 pb-2 last:pb-6">
      <div className="px-4 space-y-2">
        <h2 className="doc-heading">{snippet.title}</h2>
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
      {children !== undefined && codeSnippet !== undefined && (
        <div className="px-4 codeblock-container">
          <div className="bg rounded p-2">
            <SimpleCodeBlock className={selectedLanguage}>{codeSnippet}</SimpleCodeBlock>
          </div>
        </div>
      )}
      {children}
    </div>
  )
}
export default ContentSnippet

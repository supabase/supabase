import { useParams } from 'common'

import { SimpleCodeBlock } from '@ui/components/SimpleCodeBlock'
import { Markdown } from '../Markdown'
import { PropsWithChildren } from 'react'

interface ContentSnippetProps {
  apikey?: string
  endpoint?: string
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
  apikey,
  endpoint,
  selectedLanguage,
  snippet,
  children,
}: PropsWithChildren<ContentSnippetProps>) => {
  const { ref: projectRef } = useParams()
  const codeSnippet = snippet[selectedLanguage]?.(apikey, endpoint).replaceAll(
    '[ref]',
    projectRef ?? ''
  )

  return (
    <div id={snippet.key} className="space-y-4 py-6 pb-2 last:pb-6">
      <div className="px-4 space-y-4">
        <h2 className="doc-heading">{snippet.title}</h2>
        {snippet.description !== undefined && (
          <div className="doc-section">
            <article className="text text-sm text-foreground-light">
              <Markdown
                className="max-w-none"
                content={snippet.description.replaceAll('[ref]', projectRef ?? '_')}
              />
            </article>
          </div>
        )}
      </div>
      {children}
      {codeSnippet !== undefined && (
        <div className="px-4 codeblock-container">
          <div className="bg rounded p-2">
            <SimpleCodeBlock className={selectedLanguage}>{codeSnippet}</SimpleCodeBlock>
          </div>
        </div>
      )}
    </div>
  )
}
export default ContentSnippet

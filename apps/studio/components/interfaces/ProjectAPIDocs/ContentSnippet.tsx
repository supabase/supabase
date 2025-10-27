import { useParams } from 'common'

import { SimpleCodeBlock } from 'ui'
import { Markdown } from '../Markdown'
import { PropsWithChildren } from 'react'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'

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
  const { data: org } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()

  const codeSnippet = snippet[selectedLanguage]?.(apikey, endpoint).replaceAll(
    '[ref]',
    projectRef ?? ''
  )

  const handleCopy = () => {
    sendEvent({
      action: 'api_docs_code_copy_button_clicked',
      properties: {
        title: snippet.title,
        selectedLanguage,
      },
      groups: {
        project: projectRef ?? 'Unknown',
        organization: org?.slug ?? 'Unknown',
      },
    })
  }

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
            <SimpleCodeBlock className={selectedLanguage} onCopy={handleCopy}>
              {codeSnippet}
            </SimpleCodeBlock>
          </div>
        </div>
      )}
    </div>
  )
}
export default ContentSnippet

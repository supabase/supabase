import { useParams } from 'common'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { SimpleCodeBlock } from 'ui'

interface CodeSnippetProps {
  selectedLang: 'bash' | 'js'
  snippet: {
    title?: string
    bash: { language?: string; code: string }
    js?: { language?: string; code: string }
  }
}

const CodeSnippet = ({ selectedLang, snippet }: CodeSnippetProps) => {
  const { ref: projectRef } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()

  const handleCopy = () => {
    sendEvent({
      action: 'api_docs_code_copy_button_clicked',
      properties: {
        title: snippet.title,
        selectedLanguage: selectedLang,
      },
      groups: {
        project: projectRef ?? 'Unknown',
        organization: org?.slug ?? 'Unknown',
      },
    })
  }

  if (!snippet[selectedLang]) return null
  return (
    <div className="codeblock-container">
      <h4>{snippet.title}</h4>
      <SimpleCodeBlock className={snippet[selectedLang]?.language} onCopy={handleCopy}>
        {snippet[selectedLang]?.code}
      </SimpleCodeBlock>
    </div>
  )
}
export default CodeSnippet

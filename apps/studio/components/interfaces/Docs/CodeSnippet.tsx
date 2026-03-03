import { useParams } from 'common'
import { SimpleCodeBlock } from 'ui'

import { useSendEventMutation } from '@/data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

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
    <div>
      <h4 className="heading-default mb-2">{snippet.title}</h4>
      <div className="[&_.codeBlock]:p-0 [&_.token-line]:text-sm">
        <SimpleCodeBlock className={snippet[selectedLang]?.language} onCopy={handleCopy}>
          {snippet[selectedLang]?.code}
        </SimpleCodeBlock>
      </div>
    </div>
  )
}
export default CodeSnippet

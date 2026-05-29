import { SimpleCodeBlock } from 'ui-patterns/SimpleCodeBlock'

import { useTrack } from '@/lib/telemetry/track'

interface CodeSnippetProps {
  selectedLang: 'bash' | 'js'
  snippet: {
    title?: string
    bash: { language?: string; code: string }
    js?: { language?: string; code: string }
  }
}

const CodeSnippet = ({ selectedLang, snippet }: CodeSnippetProps) => {
  const track = useTrack()

  const handleCopy = () => {
    track('api_docs_code_copy_button_clicked', {
      title: snippet.title,
      selectedLanguage: selectedLang,
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

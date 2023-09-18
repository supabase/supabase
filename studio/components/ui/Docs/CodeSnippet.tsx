import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'

type SupportedLanguages = 'js' | 'dart' | 'python' | 'bash'

interface CodeSnippetProps {
  selectedLang: SupportedLanguages
  snippet: {
    [key in SupportedLanguages]?: {
      title?: string
      language?: SupportedLanguages
      code?: string
      resourceId?: string
      endpoint?: string
      apiKey?: string
      columnName?: string
    }
  }
  titleClasses?: string
}

const CodeSnippet = ({ selectedLang, snippet, titleClasses }: CodeSnippetProps) => {
  if (!snippet[selectedLang]) return null

  const selectedSnippet = snippet[selectedLang]

  return (
    <div className="codeblock-container">
      <h4 className={titleClasses ?? ''}>{selectedSnippet?.title}</h4>

      <SimpleCodeBlock className={selectedSnippet?.language ?? ''}>
        {selectedSnippet?.code}
      </SimpleCodeBlock>
    </div>
  )
}

export default CodeSnippet

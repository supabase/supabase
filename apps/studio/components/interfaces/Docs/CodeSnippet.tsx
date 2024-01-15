import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'

interface CodeSnippetProps {
  selectedLang: 'bash' | 'js'
  snippet: {
    title?: string
    bash: { language?: string; code: string }
    js?: { language?: string; code: string }
  }
}

const CodeSnippet = ({ selectedLang, snippet }: CodeSnippetProps) => {
  if (!snippet[selectedLang]) return null
  return (
    <div className="codeblock-container">
      <h4>{snippet.title}</h4>
      <SimpleCodeBlock className={snippet[selectedLang]?.language}>
        {snippet[selectedLang]?.code}
      </SimpleCodeBlock>
    </div>
  )
}
export default CodeSnippet

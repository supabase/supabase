import clsx from 'clsx'
import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'
import { Markdown } from '../Markdown'

interface CodeSnippetProps {
  selectedLang: 'bash' | 'js'
  snippet: {
    title?: string
    description?: string
    bash: string
    js: string
  }
}

const CodeSnippet = ({ selectedLang, snippet }: CodeSnippetProps) => {
  if (!snippet[selectedLang]) return null
  return (
    <div className="p-4 codeblock-container space-y-3">
      {(snippet.title || snippet.description) && (
        <div className="space-y-1">
          {snippet.title && <h4>{snippet.title}</h4>}
          {snippet.description && (
            <Markdown className="text-light text-sm" content={snippet.description} />
          )}
        </div>
      )}
      <div className="bg rounded p-2">
        <SimpleCodeBlock className={selectedLang}>{snippet[selectedLang]}</SimpleCodeBlock>
      </div>
    </div>
  )
}
export default CodeSnippet

import { format } from 'sql-formatter'
import { CodeBlock, cn } from 'ui'

interface SQLCodeBlockProps {
  children: string[]
  projectRef: string
}

export const SQLCodeBlock = ({ children }: SQLCodeBlockProps) => {
  let formatted = (children || [''])[0]
  try {
    formatted = format(formatted, {
      language: 'postgresql',
      keywordCase: 'upper',
    })
  } catch {}

  if (formatted.length === 0) {
    return null
  }

  return (
    <pre className="rounded-md relative group">
      <CodeBlock
        value={formatted}
        language="sql"
        className={cn(
          '!py-3 !px-3.5 prose dark:prose-dark transition max-w-full',
          // change the look of the code block. The flex hack is so that the code is wrapping since
          // every word is a separate span
          '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap'
        )}
        hideCopy
        hideLineNumbers
      />
    </pre>
  )
}

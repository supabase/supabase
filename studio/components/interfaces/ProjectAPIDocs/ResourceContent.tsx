import { useParams } from 'common'
import Link from 'next/link'
import { Button, IconExternalLink } from 'ui'

import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'
import { Markdown } from '../Markdown'

interface ResourceContentProps {
  selectedLanguage: 'js' | 'bash'
  snippet: {
    key: string
    title: string
    description?: string
    docsUrl?: string
  }
  codeSnippets: any[]
}

const ResourceContent = ({ selectedLanguage, snippet, codeSnippets }: ResourceContentProps) => {
  const { ref: projectRef } = useParams()

  return (
    <div id={snippet.key} className="space-y-4 py-6">
      <div className="px-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="doc-heading">{snippet.title}</h2>
          {snippet.docsUrl !== undefined && (
            <Button asChild type="default" icon={<IconExternalLink />}>
              <Link href={snippet.docsUrl} target="_blank" rel="noreferrer">
                Documentation
              </Link>
            </Button>
          )}
        </div>
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
      {codeSnippets.map((codeSnippet) => (
        <div key={codeSnippet.key} className="px-4 space-y-2">
          <p className="text-sm text-foreground-light">{codeSnippet.title}</p>
          <div className="codeblock-container">
            <div className="bg rounded p-2">
              <SimpleCodeBlock className={selectedLanguage}>
                {codeSnippet[selectedLanguage]}
              </SimpleCodeBlock>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
export default ResourceContent

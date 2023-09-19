import { AutoApiService } from 'data/config/project-api-query'
import Snippets from 'components/interfaces/Docs/Snippets'
import CodeSnippet from './CodeSnippet'

interface Props {
  autoApiService: AutoApiService
  selectedLang: 'bash' | 'js'
}

export default function Introduction({ autoApiService, selectedLang }: Props) {
  return (
    <>
      <div className="doc-section doc-section--client-libraries">
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.init(autoApiService.endpoint)}
          />
        </article>
      </div>
    </>
  )
}

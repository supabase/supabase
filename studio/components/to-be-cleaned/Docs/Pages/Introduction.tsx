import { AutoApiService } from 'data/config/project-api-query'
import Snippets from '../Snippets'
import CodeSnippet from '../CodeSnippet'

interface Props {
  autoApiService: AutoApiService
  selectedLang: string
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

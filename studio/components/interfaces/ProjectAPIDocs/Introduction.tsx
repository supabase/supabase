import CodeSnippet from './CodeSnippet'
import ContentSnippet from './ContentSnippet'
import { CODE_SNIPPETS, DOCS_CONTENT } from './ProjectAPIDocs.constants'

interface IntroductionProps {
  endpoint: string
}

const Introduction = ({ endpoint }: IntroductionProps) => {
  return (
    <>
      <CodeSnippet selectedLang={'js'} snippet={CODE_SNIPPETS.init('endpoint')} />
      <ContentSnippet snippet={DOCS_CONTENT.auth()} />
      <div>
        <ContentSnippet snippet={DOCS_CONTENT.clientApiKeys()} />
        <CodeSnippet
          selectedLang={'js'}
          snippet={CODE_SNIPPETS.authKey('SUPABASE_KEY', 'SUPABASE_CLIENT_API_KEY', endpoint)}
        />
      </div>
      <div>
        <ContentSnippet snippet={DOCS_CONTENT.serviceApiKeys()} />
        <CodeSnippet
          selectedLang={'js'}
          snippet={CODE_SNIPPETS.authKey('SUPABASE_KEY', 'SUPABASE_SERVICE_KEY', endpoint)}
        />
      </div>
    </>
  )
}

export default Introduction

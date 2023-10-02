import ContentSnippet from '../ContentSnippet'
import { DOCS_CONTENT } from '../ProjectAPIDocs.constants'
import { ContentProps } from './Content.types'

const Introduction = ({ language, apikey, endpoint }: ContentProps) => {
  const serviceKey = 'TO_UPDATE'

  return (
    <>
      <ContentSnippet
        selectedLanguage={language}
        apikey={apikey}
        endpoint={endpoint}
        snippet={DOCS_CONTENT.init}
      />
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.auth} />
      <ContentSnippet
        selectedLanguage={language}
        apikey={apikey}
        endpoint={endpoint}
        snippet={DOCS_CONTENT.clientApiKeys}
      />
      <ContentSnippet
        selectedLanguage={language}
        apikey={serviceKey}
        endpoint={endpoint}
        snippet={DOCS_CONTENT.serviceApiKeys}
      />
    </>
  )
}

export default Introduction

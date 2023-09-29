import ContentSnippet from '../ContentSnippet'
import { DOCS_CONTENT } from '../ProjectAPIDocs.constants'

const Introduction = () => {
  const selectedLanguage = 'js'

  return (
    <>
      <ContentSnippet selectedLanguage={selectedLanguage} snippet={DOCS_CONTENT.init} />
      <ContentSnippet selectedLanguage={selectedLanguage} snippet={DOCS_CONTENT.auth} />
      <ContentSnippet selectedLanguage={selectedLanguage} snippet={DOCS_CONTENT.clientApiKeys} />
      <ContentSnippet
        useServiceKey
        selectedLanguage={selectedLanguage}
        snippet={DOCS_CONTENT.serviceApiKeys}
      />
    </>
  )
}

export default Introduction

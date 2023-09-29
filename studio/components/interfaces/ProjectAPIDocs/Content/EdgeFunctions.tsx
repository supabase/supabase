import ContentSnippet from '../ContentSnippet'
import { DOCS_CONTENT } from '../ProjectAPIDocs.constants'

const EdgeFunctions = () => {
  const selectedLanguage = 'js'

  return (
    <>
      <ContentSnippet
        selectedLanguage={selectedLanguage}
        snippet={DOCS_CONTENT.createEdgeFunction}
      />
      <ContentSnippet
        selectedLanguage={selectedLanguage}
        snippet={DOCS_CONTENT.deployEdgeFunction}
      />
      <ContentSnippet
        selectedLanguage={selectedLanguage}
        snippet={DOCS_CONTENT.invokeEdgeFunction}
      />
    </>
  )
}

export default EdgeFunctions

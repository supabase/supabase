import ContentSnippet from '../ContentSnippet'
import { DOCS_CONTENT } from '../ProjectAPIDocs.constants'

const StoredProcedures = () => {
  const selectedLanguage = 'js'

  return (
    <>
      <ContentSnippet
        selectedLanguage={selectedLanguage}
        snippet={DOCS_CONTENT.storedProceduresIntroduction}
      />
    </>
  )
}

export default StoredProcedures

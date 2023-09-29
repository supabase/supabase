import ContentSnippet from '../ContentSnippet'
import { DOCS_CONTENT } from '../ProjectAPIDocs.constants'

const Storage = () => {
  const selectedLanguage = 'js'

  return (
    <>
      <ContentSnippet selectedLanguage={selectedLanguage} snippet={DOCS_CONTENT.uploadFile} />
      <ContentSnippet selectedLanguage={selectedLanguage} snippet={DOCS_CONTENT.deleteFiles} />
      <ContentSnippet selectedLanguage={selectedLanguage} snippet={DOCS_CONTENT.listFiles} />
      <ContentSnippet selectedLanguage={selectedLanguage} snippet={DOCS_CONTENT.createSignedURL} />
      <ContentSnippet
        selectedLanguage={selectedLanguage}
        snippet={DOCS_CONTENT.retrievePublicURL}
      />
    </>
  )
}

export default Storage

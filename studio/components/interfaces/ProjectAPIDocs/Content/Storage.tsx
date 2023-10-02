import ContentSnippet from '../ContentSnippet'
import { DOCS_CONTENT } from '../ProjectAPIDocs.constants'
import { ContentProps } from './Content.types'

const Storage = ({ language }: ContentProps) => {
  return (
    <>
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.uploadFile} />
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.deleteFiles} />
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.listFiles} />
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.createSignedURL} />
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.retrievePublicURL} />
    </>
  )
}

export default Storage

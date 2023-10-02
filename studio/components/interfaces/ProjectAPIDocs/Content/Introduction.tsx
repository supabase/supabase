import ContentSnippet from '../ContentSnippet'
import { DOCS_CONTENT } from '../ProjectAPIDocs.constants'
import { ContentProps } from './Content.types'

const Introduction = ({ language }: ContentProps) => {
  return (
    <>
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.init} />
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.auth} />
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.clientApiKeys} />
      <ContentSnippet
        useServiceKey
        selectedLanguage={language}
        snippet={DOCS_CONTENT.serviceApiKeys}
      />
    </>
  )
}

export default Introduction

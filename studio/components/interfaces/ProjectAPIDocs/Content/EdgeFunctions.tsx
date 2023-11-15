import ContentSnippet from '../ContentSnippet'
import { DOCS_CONTENT } from '../ProjectAPIDocs.constants'
import { ContentProps } from './Content.types'

const EdgeFunctions = ({ language }: ContentProps) => {
  return (
    <>
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.edgeFunctions} />
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.edgeFunctionsPreReq} />
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.createEdgeFunction} />
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.deployEdgeFunction} />
    </>
  )
}

export default EdgeFunctions

import ContentSnippet from '../ContentSnippet'
import { DOCS_CONTENT } from '../ProjectAPIDocs.constants'
import type { ContentProps } from './Content.types'

const StoredProcedures = ({ language }: ContentProps) => {
  return (
    <>
      <ContentSnippet
        selectedLanguage={language}
        snippet={DOCS_CONTENT.storedProceduresIntroduction}
      />
    </>
  )
}

export default StoredProcedures

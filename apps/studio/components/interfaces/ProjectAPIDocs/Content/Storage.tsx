import ContentSnippet from '../ContentSnippet'
import { DOCS_CONTENT } from '../ProjectAPIDocs.constants'
import type { ContentProps } from './Content.types'

const Storage = ({ language }: ContentProps) => {
  return (
    <>
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.storage} />
    </>
  )
}

export default Storage

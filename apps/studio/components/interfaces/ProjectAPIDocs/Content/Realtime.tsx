import ContentSnippet from '../ContentSnippet'
import { DOCS_CONTENT } from '../ProjectAPIDocs.constants'
import { ContentProps } from './Content.types'

const Realtime = ({ language }: ContentProps) => {
  return (
    <>
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.realtime} />
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.subscribeChannel} />
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.unsubscribeChannel} />
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.unsubscribeChannels} />
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.retrieveAllChannels} />
    </>
  )
}

export default Realtime

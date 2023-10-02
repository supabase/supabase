import ContentSnippet from '../ContentSnippet'
import { DOCS_CONTENT } from '../ProjectAPIDocs.constants'
import { ContentProps } from './Content.types'

const UserManagement = ({ language }: ContentProps) => {
  return (
    <>
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.userManagement} />
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.signUp} />
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.emailLogin} />
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.magicLinkLogin} />
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.phoneLogin} />
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.smsLogin} />
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.smsVerify} />
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.oauthLogin} />
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.user} />
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.forgotPassWordEmail} />
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.updateUser} />
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.logout} />
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.emailInvite} />
    </>
  )
}

export default UserManagement

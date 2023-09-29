import ContentSnippet from '../ContentSnippet'
import { DOCS_CONTENT } from '../ProjectAPIDocs.constants'

const UserManagement = () => {
  const selectedLanguage = 'js'

  return (
    <>
      <ContentSnippet selectedLanguage={selectedLanguage} snippet={DOCS_CONTENT.userManagement} />
      <ContentSnippet selectedLanguage={selectedLanguage} snippet={DOCS_CONTENT.signUp} />
      <ContentSnippet selectedLanguage={selectedLanguage} snippet={DOCS_CONTENT.emailLogin} />
      <ContentSnippet selectedLanguage={selectedLanguage} snippet={DOCS_CONTENT.magicLinkLogin} />
      <ContentSnippet selectedLanguage={selectedLanguage} snippet={DOCS_CONTENT.phoneLogin} />
      <ContentSnippet selectedLanguage={selectedLanguage} snippet={DOCS_CONTENT.smsLogin} />
      <ContentSnippet selectedLanguage={selectedLanguage} snippet={DOCS_CONTENT.smsVerify} />
      <ContentSnippet selectedLanguage={selectedLanguage} snippet={DOCS_CONTENT.oauthLogin} />
      <ContentSnippet selectedLanguage={selectedLanguage} snippet={DOCS_CONTENT.user} />
      <ContentSnippet
        selectedLanguage={selectedLanguage}
        snippet={DOCS_CONTENT.forgotPassWordEmail}
      />
      <ContentSnippet selectedLanguage={selectedLanguage} snippet={DOCS_CONTENT.updateUser} />
      <ContentSnippet selectedLanguage={selectedLanguage} snippet={DOCS_CONTENT.logout} />
      <ContentSnippet selectedLanguage={selectedLanguage} snippet={DOCS_CONTENT.emailInvite} />
    </>
  )
}

export default UserManagement

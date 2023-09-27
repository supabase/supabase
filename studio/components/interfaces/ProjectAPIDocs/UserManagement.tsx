import CodeSnippet from './CodeSnippet'
import ContentSnippet from './ContentSnippet'
import { CODE_SNIPPETS, DOCS_CONTENT } from './ProjectAPIDocs.constants'

interface UserManagementProps {
  endpoint: string
}

const UserManagement = ({ endpoint }: UserManagementProps) => {
  return (
    <>
      <ContentSnippet snippet={DOCS_CONTENT.userManagement()} />
      <div>
        <ContentSnippet snippet={DOCS_CONTENT.signUp()} />
        <CodeSnippet
          selectedLang="js"
          snippet={CODE_SNIPPETS.authSignup(endpoint, 'API_KEY', 'random')}
        />
      </div>
    </>
  )
}

export default UserManagement

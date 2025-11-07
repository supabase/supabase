import { useEffect } from 'react'

import { useParams } from 'common'
import { useGitHubAuthorizationCreateMutation } from 'data/integrations/github-authorization-create-mutation'

const GitHubIntegrationAuthorize = () => {
  const { code, state, setup_action } = useParams()

  const { mutate, isSuccess, isError, isLoading } = useGitHubAuthorizationCreateMutation({
    onSuccess() {
      window.close()
    },
  })

  useEffect(() => {
    if (code && state) {
      mutate({ code, state })
    } else if (setup_action === 'install') {
      window.close()
    }
  }, [code, state, mutate, setup_action])

  return (
    <div className="h-screen flex flex-col justify-center items-center gap-4">
      <h2>Completing GitHub Authorization...</h2>

      {isSuccess && <p>You can now close this window.</p>}
      {isLoading && <p>Authorizing...</p>}
      {isError && <p>Unable to authorize. Please try again.</p>}
    </div>
  )
}

export default GitHubIntegrationAuthorize

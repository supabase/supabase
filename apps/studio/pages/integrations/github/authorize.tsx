import { useEffect } from 'react'

import { useParams } from 'common'
import { useGitHubAuthorizationCreateMutation } from 'data/integrations/github-authorization-create-mutation'

const GitHubIntegrationAuthorize = () => {
  const { code, state } = useParams()

  const { mutate, isSuccess, isError, isLoading } = useGitHubAuthorizationCreateMutation({
    onSuccess() {
      window.close()
    },
  })

  useEffect(() => {
    if (code && state) {
      mutate({ code, state })
    }
  }, [code, state, mutate])

  return (
    <div className="h-screen flex flex-col justify-center items-center gap-4">
      <h2 className="text-xl">Completing GitHub Authorization...</h2>

      {isSuccess && <p>You can now close this window.</p>}
      {isLoading && <p>Authorizing...</p>}
      {isError && <p>Unable to authorize. Please try again.</p>}
    </div>
  )
}

export default GitHubIntegrationAuthorize

import { useEffect } from 'react'

import { useParams } from 'common'
import { useGitLabAuthorizationCreateMutation } from 'data/integrations/gitlab-authorization-create-mutation'

const GitLabIntegrationAuthorize = () => {
  const { code, state, setup_action } = useParams()

  const { mutate, isSuccess, isError, isLoading } = useGitLabAuthorizationCreateMutation({
    onSuccess() {
      window.close()
    },
  })

  useEffect(() => {
    if (code && state) {
      mutate({ code, state })
    }
  }, [code, state, mutate, setup_action])

  return (
    <div className="h-screen flex flex-col justify-center items-center gap-4">
      <h2 className="text-xl">Completing GitLab Authorization...</h2>

      {isSuccess && <p>You can now close this window.</p>}
      {isLoading && <p>Authorizing...</p>}
      {isError && <p>Unable to authorize. Please try again.</p>}
    </div>
  )
}

export default GitLabIntegrationAuthorize

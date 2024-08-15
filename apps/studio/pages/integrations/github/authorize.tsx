import { useEffect } from 'react'

import { useParams } from 'common'
import { useGitHubAuthorizationCreateMutation } from 'data/integrations/github-authorization-create-mutation'

const GitHubIntegrationAuthorize = () => {
  const { code } = useParams()

  const { mutate, isSuccess } = useGitHubAuthorizationCreateMutation({
    onSuccess() {
      window.close()
    },
  })

  useEffect(() => {
    if (code) {
      mutate({ code })
    }
  }, [code, mutate])

  return (
    <div className="h-screen flex flex-col justify-center items-center gap-4">
      <h2 className="text-xl">Completing GitHub Authorization...</h2>

      {isSuccess ? <p>You can now close this window.</p> : <p />}
    </div>
  )
}

export default GitHubIntegrationAuthorize

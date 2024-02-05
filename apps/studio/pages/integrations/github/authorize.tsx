import { useEffect } from 'react'

import { useParams } from 'common'
import { useGitHubAuthorizationCreateMutation } from 'data/integrations/github-authorization-create-mutation'

const GitHubIntegrationAuthorize = () => {
  const { code } = useParams()

  const { mutate } = useGitHubAuthorizationCreateMutation({
    onSuccess() {
      window.close()
    },
  })

  useEffect(() => {
    if (code) {
      mutate({ code })
    }
  }, [code, mutate])

  return <div>hello</div>
}

export default GitHubIntegrationAuthorize

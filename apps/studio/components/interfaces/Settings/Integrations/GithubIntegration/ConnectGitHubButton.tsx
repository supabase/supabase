import { Button } from 'ui'

import { openInstallGitHubIntegrationWindow } from '@/lib/github'

export const ConnectGitHubButton = ({
  id,
  onConnectClick,
  refetch,
}: {
  id?: string

  onConnectClick?: () => void
  refetch: () => void
}) => {
  return (
    <Button
      id={id}
      size="tiny"
      type="button"
      onClick={() => {
        onConnectClick?.()
        openInstallGitHubIntegrationWindow('authorize', refetch)
      }}
    >
      Connect GitHub
    </Button>
  )
}

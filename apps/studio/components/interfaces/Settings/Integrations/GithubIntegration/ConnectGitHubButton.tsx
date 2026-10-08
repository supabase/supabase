import { Button } from 'ui'

import { openInstallGitHubIntegrationWindow } from '@/lib/github'

export const ConnectGitHubButton = ({
  id,
  disabled,
  onConnectClick,
  refetch,
}: {
  id?: string
  disabled?: boolean
  onConnectClick?: () => void
  refetch: () => void
}) => {
  return (
    <Button
      id={id}
      size="tiny"
      type="button"
      disabled={disabled}
      onClick={() => {
        onConnectClick?.()
        openInstallGitHubIntegrationWindow('authorize', refetch)
      }}
    >
      Connect GitHub
    </Button>
  )
}

import { Github } from 'lucide-react'
import Image from 'next/image'

import Panel from 'components/ui/Panel'
import { useGitHubAuthorizationQuery } from 'data/integrations/github-authorization-query'
import { BASE_PATH } from 'lib/constants'
import { openInstallGitHubIntegrationWindow } from 'lib/github'
import { Badge, Button, cn } from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'

const AccountConnections = () => {
  const {
    data: gitHubAuthorization,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useGitHubAuthorizationQuery()

  const isConnected = gitHubAuthorization !== null

  const handleConnect = () => {
    openInstallGitHubIntegrationWindow('authorize')
  }

  return (
    <Panel
      className="mb-4 md:mb-8"
      title={
        <div>
          <h5>Connections</h5>
          <p className="text-sm text-foreground-lighter">
            Connect your Supabase account with other services
          </p>
        </div>
      }
    >
      {isLoading && (
        <Panel.Content>
          <ShimmeringLoader />
        </Panel.Content>
      )}
      {isError && (
        <Panel.Content>
          <p className="text-sm text-destructive">
            Failed to load GitHub connection status: {error?.message}
          </p>
        </Panel.Content>
      )}
      {isSuccess && (
        <Panel.Content className="flex justify-between items-center">
          <div className="flex gap-x-4 items-center">
            <Image
              className={cn('dark:invert')}
              src={`${BASE_PATH}/img/icons/github-icon.svg`}
              width={30}
              height={30}
              alt={`GitHub icon`}
            />
            <div>
              <p className="text-sm">GitHub</p>
              <p className="text-sm text-foreground-lighter">
                Sync GitHub repos to Supabase projects for automatic branch creation and merging
              </p>
            </div>
          </div>
          <div className="flex items-center gap-x-1">
            {isConnected ? (
              <Badge variant="success">Connected</Badge>
            ) : (
              <Button type="primary" onClick={handleConnect}>
                Connect
              </Button>
            )}
          </div>
        </Panel.Content>
      )}
    </Panel>
  )
}

export { AccountConnections }

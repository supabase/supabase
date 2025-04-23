import React from 'react'
import Panel from 'components/ui/Panel'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { Button, cn } from 'ui'
import { useGitHubAuthorizationQuery } from 'data/integrations/github-authorization-query'
import { openInstallGitHubIntegrationWindow } from 'lib/github'
import { Github } from 'lucide-react' // Import Github icon
import Image from 'next/image'
import { BASE_PATH } from 'lib/constants'

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

  // TODO: Implement disconnect functionality
  const handleDisconnect = () => {
    console.log('Disconnect GitHub clicked')
    // This will likely involve a mutation to revoke the authorization.
  }

  return (
    <Panel
      className="mb-4 md:mb-8"
      title={
        <div>
          <h5>Connections</h5>
          <p className="text-sm text-foreground-lighter">
            Connect your GitHub account to sync projects with GitHub repositories
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
            <div className="w-[30px] h-[30px] bg-alternative rounded flex items-center justify-center border">
              <Github size={18} strokeWidth={1.5} />
              <Image
                className={cn('dark:invert')}
                src={`${BASE_PATH}/img/icons/github-icon.svg`}
                width={30}
                height={30}
                alt={`GitHub icon`}
              />
            </div>
            <div>
              <p className="text-sm">GitHub</p>
              <p className="text-sm text-foreground-lighter">
                {isConnected ? 'Authorized' : 'Not authorized'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-x-1">
            {isConnected ? (
              <Button type="default" onClick={handleDisconnect}>
                Disconnect
              </Button>
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

import { ChevronDown, RefreshCw, Unlink } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { toast } from 'sonner'

import Panel from 'components/ui/Panel'
import { useGitHubAuthorizationDeleteMutation } from 'data/integrations/github-authorization-delete-mutation'
import { useGitHubAuthorizationQuery } from 'data/integrations/github-authorization-query'
import { BASE_PATH } from 'lib/constants'
import { openInstallGitHubIntegrationWindow } from 'lib/github'
import {
  Badge,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'

export const AccountConnections = () => {
  const {
    data: gitHubAuthorization,
    isPending: isLoading,
    isSuccess,
    isError,
    error,
  } = useGitHubAuthorizationQuery()

  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false)

  const isConnected = gitHubAuthorization !== null

  const { mutate: removeAuthorization, isPending: isRemoving } =
    useGitHubAuthorizationDeleteMutation({
      onSuccess: () => {
        toast.success('GitHub authorization removed successfully')
        setIsRemoveModalOpen(false)
      },
    })

  const handleConnect = () => {
    openInstallGitHubIntegrationWindow('authorize')
  }

  const handleReauthenticate = () => {
    openInstallGitHubIntegrationWindow('authorize')
  }

  const handleRemove = () => {
    removeAuthorization()
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
          <div className="flex items-center gap-x-2 ml-2">
            {isConnected ? (
              <>
                <Badge variant="success">Connected</Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button iconRight={<ChevronDown size={14} />} type="default">
                      <span>Manage</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="end">
                    <DropdownMenuItem
                      className="space-x-2"
                      onSelect={(event) => {
                        event.preventDefault()
                        handleReauthenticate()
                      }}
                    >
                      <RefreshCw size={14} />
                      <p>Re-authenticate</p>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="space-x-2"
                      onSelect={() => setIsRemoveModalOpen(true)}
                    >
                      <Unlink size={14} />
                      <p>Remove connection</p>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button type="primary" onClick={handleConnect}>
                Connect
              </Button>
            )}
          </div>
        </Panel.Content>
      )}
      <ConfirmationModal
        variant="destructive"
        size="small"
        visible={isRemoveModalOpen}
        title="Confirm to remove GitHub authorization"
        confirmLabel="Remove connection"
        onCancel={() => setIsRemoveModalOpen(false)}
        onConfirm={handleRemove}
        loading={isRemoving}
      >
        <p className="text-sm text-foreground-light">
          Removing this authorization will disconnect your GitHub account from Supabase. You can
          reconnect at any time.
        </p>
      </ConfirmationModal>
    </Panel>
  )
}

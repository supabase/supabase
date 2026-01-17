import { ChevronDown, RefreshCw, Unlink } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { toast } from 'sonner'

import { useGitHubAuthorizationDeleteMutation } from 'data/integrations/github-authorization-delete-mutation'
import { useGitHubAuthorizationQuery } from 'data/integrations/github-authorization-query'
import { BASE_PATH } from 'lib/constants'
import { openInstallGitHubIntegrationWindow } from 'lib/github'
import {
  Badge,
  Button,
  Card,
  CardContent,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

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
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Connections</PageSectionTitle>
          <PageSectionDescription>
            Connect your Supabase account with other services.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Card>
          {isLoading && (
            <CardContent>
              <ShimmeringLoader />
            </CardContent>
          )}
          {isError && (
            <CardContent>
              <p className="text-sm text-destructive">
                Failed to load GitHub connection status: {error?.message}
              </p>
            </CardContent>
          )}
          {isSuccess && (
            <CardContent className="flex justify-between items-center">
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
                    Sync repos to Supabase projects for automatic branch creation and merging
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
                      <DropdownMenuContent side="bottom" align="end" className="w-44">
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
                        <DropdownMenuSeparator />
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
            </CardContent>
          )}
        </Card>
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
      </PageSectionContent>
    </PageSection>
  )
}

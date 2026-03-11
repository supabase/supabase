import { PermissionAction } from '@supabase/shared-types/out/constants'
import { partition } from 'lodash'
import { MessageCircle } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { Overview } from 'components/interfaces/BranchManagement/Overview'
import BranchLayout from 'components/layouts/BranchLayout/BranchLayout'
import { DefaultLayout } from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { AlertError } from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DocsButton } from 'components/ui/DocsButton'
import { NoPermission } from 'components/ui/NoPermission'
import { TextConfirmModal } from 'components/ui/TextConfirmModalWrapper'
import { useBranchDeleteMutation } from 'data/branches/branch-delete-mutation'
import { Branch, useBranchesQuery } from 'data/branches/branches-query'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
import type { NextPageWithLayout } from 'types'
import { Button } from 'ui'

const BranchesPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()
  const snap = useAppStateSnapshot()
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrg } = useSelectedOrganizationQuery()

  const [selectedBranchToDelete, setSelectedBranchToDelete] = useState<Branch>()

  const { mutate: sendEvent } = useSendEventMutation()

  const isBranch = project?.parent_project_ref !== undefined
  const projectRef =
    project !== undefined ? (isBranch ? project.parent_project_ref : ref) : undefined

  const { can: canReadBranches, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'preview_branches'
  )

  const {
    data: connections,
    error: connectionsError,
    isPending: isLoadingConnections,
    isSuccess: isSuccessConnections,
    isError: isErrorConnections,
  } = useGitHubConnectionsQuery({
    organizationId: selectedOrg?.id,
  })

  const {
    data: branches,
    error: branchesError,
    isPending: isLoadingBranches,
    isError: isErrorBranches,
    isSuccess: isSuccessBranches,
  } = useBranchesQuery({ projectRef })
  const [[mainBranch], previewBranchesUnsorted] = partition(branches, (branch) => branch.is_default)
  const previewBranches = previewBranchesUnsorted.sort((a, b) =>
    new Date(a.updated_at) < new Date(b.updated_at) ? 1 : -1
  )

  const githubConnection = connections?.find((connection) => connection.project.ref === projectRef)
  const repo = githubConnection?.repository.name ?? ''

  const isError = isErrorConnections || isErrorBranches
  const isLoading = isLoadingConnections || isLoadingBranches
  const isSuccess = isSuccessConnections && isSuccessBranches

  const isGithubConnected = githubConnection !== undefined

  const { mutate: deleteBranch, isPending: isDeleting } = useBranchDeleteMutation({
    onSuccess: () => {
      toast.success('Successfully deleted branch')
      setSelectedBranchToDelete(undefined)
    },
  })

  const generateCreatePullRequestURL = (branch?: string) => {
    if (githubConnection === undefined) return 'https://github.com'

    return branch !== undefined
      ? `https://github.com/${githubConnection.repository.name}/compare/${mainBranch?.git_branch}...${branch}`
      : `https://github.com/${githubConnection.repository.name}/compare`
  }

  const onConfirmDeleteBranch = () => {
    if (selectedBranchToDelete === undefined) return console.error('No branch selected')
    const {
      project_ref: branchRef,
      parent_project_ref: projectRef,
      persistent,
    } = selectedBranchToDelete
    deleteBranch(
      { branchRef, projectRef },
      {
        onSuccess: () => {
          if (branchRef === ref) {
            router.push(`/project/${projectRef}/branches`)
          }
          // Track delete button click
          sendEvent({
            action: 'branch_delete_button_clicked',
            properties: {
              branchType: persistent ? 'persistent' : 'preview',
              origin: 'branches_page',
            },
            groups: {
              project: projectRef ?? 'Unknown',
              organization: selectedOrg?.slug ?? 'Unknown',
            },
          })
        },
      }
    )
  }

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            <div className="space-y-4">
              {isPermissionsLoaded && !canReadBranches ? (
                <NoPermission resourceText="view this project's branches" />
              ) : (
                <>
                  {isErrorConnections && (
                    <AlertError
                      error={connectionsError}
                      subject="Failed to retrieve GitHub integration connection"
                    />
                  )}

                  {isErrorBranches && (
                    <AlertError
                      error={branchesError}
                      subject="Failed to retrieve preview branches"
                    />
                  )}

                  {!isError && (
                    <Overview
                      isGithubConnected={isGithubConnected}
                      isLoading={isLoading}
                      isSuccess={isSuccess}
                      repo={repo}
                      mainBranch={mainBranch}
                      previewBranches={previewBranches}
                      onSelectCreateBranch={() => snap.setShowCreateBranchModal(true)}
                      onSelectDeleteBranch={setSelectedBranchToDelete}
                      generateCreatePullRequestURL={generateCreatePullRequestURL}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>

      <TextConfirmModal
        variant="warning"
        visible={selectedBranchToDelete !== undefined}
        onCancel={() => setSelectedBranchToDelete(undefined)}
        onConfirm={() => onConfirmDeleteBranch()}
        loading={isDeleting}
        title="Delete branch"
        confirmLabel="Delete branch"
        confirmPlaceholder="Type in name of branch"
        confirmString={selectedBranchToDelete?.name ?? ''}
        alert={{
          title: 'You cannot recover this branch once deleted',
        }}
        text={
          <>
            This will delete your database preview branch{' '}
            <span className="text-bold text-foreground">{selectedBranchToDelete?.name}</span>.
          </>
        }
      />
    </>
  )
}

BranchesPage.getLayout = (page) => {
  const BranchesPageWrapper = () => {
    const snap = useAppStateSnapshot()
    const { can: canCreateBranches } = useAsyncCheckPermissions(
      PermissionAction.CREATE,
      'preview_branches',
      {
        resource: { is_default: false },
      }
    )

    const primaryActions = (
      <ButtonTooltip
        type="primary"
        disabled={!canCreateBranches}
        onClick={() => snap.setShowCreateBranchModal(true)}
        tooltip={{
          content: {
            side: 'bottom',
            text: !canCreateBranches
              ? 'You need additional permissions to create branches'
              : undefined,
          },
        }}
      >
        Create branch
      </ButtonTooltip>
    )

    const secondaryActions = (
      <div className="flex items-center gap-x-2">
        <Button asChild type="text" icon={<MessageCircle className="text-muted" strokeWidth={1} />}>
          <a
            target="_blank"
            rel="noreferrer"
            href="https://github.com/orgs/supabase/discussions/18937"
          >
            Branching feedback
          </a>
        </Button>
        <DocsButton href={`${DOCS_URL}/guides/platform/branching`} />
      </div>
    )

    return (
      <PageLayout
        title="Branches"
        subtitle="Manage your database preview branches and deployments"
        primaryActions={primaryActions}
        secondaryActions={secondaryActions}
      >
        {page}
      </PageLayout>
    )
  }

  return (
    <DefaultLayout>
      <BranchLayout>
        <BranchesPageWrapper />
      </BranchLayout>
    </DefaultLayout>
  )
}

export default BranchesPage

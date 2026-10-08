import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { partition } from 'lodash'
import { useRouter } from 'next/router'
import { useState, type PropsWithChildren } from 'react'

import { BranchingEmptyState } from '@/components/interfaces/BranchManagement/BranchingEmptyState'
import { CreateBranchButton } from '@/components/interfaces/BranchManagement/CreateBranchButton'
import { DeleteBranchModal } from '@/components/interfaces/BranchManagement/DeleteBranchModal'
import { Overview } from '@/components/interfaces/BranchManagement/Overview'
import BranchLayout from '@/components/layouts/BranchLayout/BranchLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { PageLayout } from '@/components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from '@/components/layouts/Scaffold'
import { AlertError } from '@/components/ui/AlertError'
import { DocsButton } from '@/components/ui/DocsButton'
import { NoPermission } from '@/components/ui/NoPermission'
import { Branch, useBranchesQuery } from '@/data/branches/branches-query'
import { useGitHubConnectionsQuery } from '@/data/integrations/github-connections-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'
import { useAppStateSnapshot } from '@/state/app-state'
import type { NextPageWithLayout } from '@/types'

const BranchesPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()
  const snap = useAppStateSnapshot()
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrg } = useSelectedOrganizationQuery()

  const [selectedBranchToDelete, setSelectedBranchToDelete] = useState<Branch>()

  const track = useTrack()

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
  const isGithubConnected = githubConnection !== undefined
  const repo = githubConnection?.repository.name ?? ''
  const showEmptyState = isSuccessConnections && isSuccessBranches && previewBranches.length === 0

  const isError = isErrorConnections || isErrorBranches
  const isLoading = isLoadingConnections || isLoadingBranches
  const isSuccess = isSuccessConnections && isSuccessBranches

  const generateCreatePullRequestURL = (branch?: string) => {
    if (githubConnection === undefined) return 'https://github.com'

    return branch !== undefined
      ? `https://github.com/${githubConnection.repository.name}/compare/${mainBranch?.git_branch}...${branch}`
      : `https://github.com/${githubConnection.repository.name}/compare`
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

                  {!isError && showEmptyState ? (
                    <BranchingEmptyState isGithubConnected={isGithubConnected} />
                  ) : (
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

      <DeleteBranchModal
        branch={selectedBranchToDelete}
        open={!!selectedBranchToDelete}
        onClose={() => setSelectedBranchToDelete(undefined)}
        onSuccess={() => {
          if (selectedBranchToDelete?.project_ref === ref) {
            router.push(`/project/${projectRef}/branches`)
          }
          track(
            'branch_delete_button_clicked',
            {
              branchType: selectedBranchToDelete?.persistent ? 'persistent' : 'preview',
              origin: 'branches_page',
            },
            { project: projectRef }
          )
        }}
      />
    </>
  )
}

// Hoisted out of `getLayout` so the TanStack route can import it
// directly. Same shape and identical body as before — accepts the page
// content as `children` instead of capturing it from a closure.
export const BranchesPageWrapper = ({ children }: PropsWithChildren) => {
  return (
    <PageLayout
      title="Branches"
      subtitle="Manage your database preview branches and deployments"
      primaryActions={<CreateBranchButton />}
      secondaryActions={<DocsButton href={`${DOCS_URL}/guides/platform/branching`} />}
    >
      {children}
    </PageLayout>
  )
}

BranchesPage.getLayout = (page) => (
  <DefaultLayout>
    <BranchLayout>
      <BranchesPageWrapper>{page}</BranchesPageWrapper>
    </BranchLayout>
  </DefaultLayout>
)

export default BranchesPage

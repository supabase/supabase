import { useParams } from 'common'
import { GitBranch } from 'lucide-react'
import Link from 'next/link'
import { IconExternalLink, Input, Modal } from 'ui'

import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useSelectedOrganization, useSelectedProject } from 'hooks'
import { useCheckGithubBranchValidity } from 'data/integrations/integrations-github-branch-check'

interface CreateBranchModalProps {
  visible: boolean
  onClose: () => void
}

const CreateBranchModal = ({ visible, onClose }: CreateBranchModalProps) => {
  const { ref } = useParams()
  const projectDetails = useSelectedProject()
  const selectedOrg = useSelectedOrganization()

  const isBranch = projectDetails?.parent_project_ref !== undefined
  const projectRef =
    projectDetails !== undefined ? (isBranch ? projectDetails.parent_project_ref : ref) : undefined

  const {
    data: integrations,
    error: integrationsError,
    isLoading: isLoadingIntegrations,
    isSuccess: isSuccessIntegrations,
    isError: isErrorIntegrations,
  } = useOrgIntegrationsQuery({
    orgSlug: selectedOrg?.slug,
  })

  const { data: branches } = useBranchesQuery({ projectRef })

  const { mutate: checkGithubBranchValidity } = useCheckGithubBranchValidity({
    onSuccess: (data) => {
      // setSelectedBranch(data)
    },
    onError: (error) => {
      // setError(error)
    },
  })

  const githubIntegration = integrations?.find(
    (integration) =>
      integration.integration.name === 'GitHub' &&
      integration.connections.some(
        (connection) => connection.supabase_project_ref === projectDetails?.parentRef
      )
  )
  const githubConnection = githubIntegration?.connections?.find(
    (connection) => connection.supabase_project_ref === projectDetails?.parentRef
  )
  const [repoOwner, repoName] = githubConnection?.metadata.name.split('/') || []

  return (
    <Modal
      alignFooter="right"
      size="small"
      visible={visible}
      onCancel={onClose}
      header="Create a new preview branch"
      confirmText="Create Preview Branch"
    >
      <Modal.Content className="pt-3 pb-1">
        {isLoadingIntegrations && <GenericSkeletonLoader />}
        {isSuccessIntegrations && (
          <div>
            <p className="text-sm text-foreground-light">
              Your project is currently connected to the repository:
            </p>
            <div className="flex items-center space-x-2">
              <p>{githubConnection?.metadata.name}</p>
              <Link passHref href={`https://github.com/${repoOwner}/${repoName}`}>
                <a target="_blank" rel="noreferrer">
                  <IconExternalLink size={14} strokeWidth={1.5} />
                </a>
              </Link>
            </div>
          </div>
        )}
      </Modal.Content>
      <Modal.Separator />
      <Modal.Content className="pt-1 pb-3 space-y-3">
        <p className="text-sm">
          Choose a Git Branch to base your Preview Branch on. Any migration changes added to this
          Git Branch will be run on this new Preview Branch.
        </p>
        <Input label="Branch name" icon={<GitBranch size={16} />} placeholder="Enter branch name" />
      </Modal.Content>
    </Modal>
  )
}

export default CreateBranchModal

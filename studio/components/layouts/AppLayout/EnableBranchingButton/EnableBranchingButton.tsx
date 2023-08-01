import { useParams } from 'common'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useSelectedOrganization } from 'hooks'
import { useState } from 'react'
import { Button, IconFileText, IconGitBranch, Modal } from 'ui'
import BranchingWaitlistPopover from './BranchingWaitlistPopover'
import GithubRepositorySelection from './GithubRepositorySelection'
import VercelProjectSelection from './VercelProjectSelection'

const EnableBranchingButton = () => {
  const { ref } = useParams()
  const [open, setOpen] = useState(false)
  const selectedOrg = useSelectedOrganization()

  const {
    data: integrations,
    error: integrationsError,
    isLoading: isLoadingIntegrations,
    isSuccess: isSuccessIntegrations,
    isError: isErrorIntegrations,
  } = useOrgIntegrationsQuery({
    orgSlug: selectedOrg?.slug,
  })

  // [Joshen] To be dynamic
  const isBranchingAllowed = true

  const githubIntegration = integrations?.find(
    (integration) =>
      integration.integration.name === 'GitHub' &&
      integration.organization.slug === selectedOrg?.slug
  )

  const vercelIntegration = integrations?.find(
    (integration) => integration.integration.name === 'Vercel'
  )
  const vercelProjectIntegration = vercelIntegration?.connections.find(
    (connection) => connection.supabase_project_ref === ref
  )

  if (!isBranchingAllowed) {
    return <BranchingWaitlistPopover />
  }

  return (
    <>
      <Button
        icon={<IconGitBranch strokeWidth={1.5} />}
        type="default"
        onClick={() => setOpen(true)}
      >
        Enable branching
      </Button>
      <Modal hideFooter visible={open} onCancel={() => setOpen(false)}>
        <Modal.Content>
          <div className="flex items-center space-x-4 py-4">
            <IconGitBranch strokeWidth={2} size={20} />
            <div>
              <p className="text">Enable database branching</p>
              <p className="text-sm text-light">Management environments in Supabase</p>
            </div>
          </div>
        </Modal.Content>

        <GithubRepositorySelection integration={githubIntegration} />

        {/* <VercelProjectSelection integration={vercelIntegration} /> */}

        {/* <Modal.Separator /> */}

        {/* [Joshen TODO] Feels like this copy writing needs some relooking before we ship, make sure they are factual too */}
        <Modal.Content>
          <div className="py-6 space-y-3">
            <p className="text-sm text-light">Please keep in mind the following:</p>
            <div className="flex space-x-4">
              <div>
                <div className="w-10 h-10 border rounded-md bg-amber-200 border-amber-700 flex items-center justify-center">
                  <IconFileText className="text-amber-900" size={20} strokeWidth={2} />
                </div>
              </div>
              <div>
                <p className="text-sm text">
                  You will not be able to use the dashboard to make changes to the database
                </p>
                <p className="text-sm text-light">
                  Schema changes for database preview branches must be done via Git. We are
                  nonetheless working on allowing the dashboard to make schema changes for preview
                  branches.
                </p>
              </div>
            </div>
          </div>
        </Modal.Content>

        <Modal.Separator />

        <Modal.Content>
          <div className="flex items-center space-x-2 py-2 pb-4">
            <Button block type="default">
              Cancel
            </Button>
            <Button block disabled type="primary">
              I understand, enable branching
            </Button>
          </div>
        </Modal.Content>
      </Modal>
    </>
  )
}

export default EnableBranchingButton

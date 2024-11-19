import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Loader, Shield, Users, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DocsButton } from 'components/ui/DocsButton'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectTransferMutation } from 'data/projects/project-transfer-mutation'
import { useProjectTransferPreviewQuery } from 'data/projects/project-transfer-preview-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useFlag } from 'hooks/ui/useFlag'
import { Alert, Button, InfoIcon, Listbox, Loading, Modal } from 'ui'

const TransferProjectButton = () => {
  const project = useSelectedProject()
  const projectRef = project?.ref
  const projectOrgId = project?.organization_id
  const { data: allOrganizations } = useOrganizationsQuery()
  const disableProjectTransfer = useFlag('disableProjectTransfer')

  const organizations = (allOrganizations || []).filter((it) => it.id !== projectOrgId)

  const [isOpen, setIsOpen] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState()

  const {
    mutate: transferProject,
    error: transferError,
    isLoading: isTransferring,
  } = useProjectTransferMutation({
    onSuccess: () => {
      toast.success(`Successfully transferred project ${project?.name}.`)
      setIsOpen(false)
    },
  })

  const {
    data: transferPreviewData,
    error: transferPreviewError,
    isLoading: transferPreviewIsLoading,
    remove,
  } = useProjectTransferPreviewQuery(
    { projectRef, targetOrganizationSlug: selectedOrg },
    { enabled: !isTransferring && isOpen }
  )

  useEffect(() => {
    if (isOpen) {
      // reset state
      setSelectedOrg(undefined)
    } else {
      // Invalidate cache
      remove()
    }
  }, [isOpen])

  const canTransferProject = useCheckPermissions(PermissionAction.UPDATE, 'organizations')

  const toggle = () => {
    setIsOpen(!isOpen)
  }

  async function handleTransferProject() {
    if (project === undefined) return
    if (selectedOrg === undefined) return
    transferProject({ projectRef, targetOrganizationSlug: selectedOrg })
  }

  return (
    <>
      <ButtonTooltip
        type="default"
        onClick={toggle}
        disabled={!canTransferProject || disableProjectTransfer}
        tooltip={{
          content: {
            side: 'bottom',
            text: !canTransferProject
              ? 'You need additional permissions to transfer this project'
              : disableProjectTransfer
                ? 'Project transfers are temporarily disabled, please try again later.'
                : undefined,
          },
        }}
      >
        Transfer project
      </ButtonTooltip>

      <Modal
        onCancel={() => toggle()}
        visible={isOpen}
        loading={isTransferring}
        size={'xlarge'}
        header={`Transfer project ${project?.name}`}
        customFooter={
          <div className="flex items-center space-x-2 justify-end">
            <Button type="default" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleTransferProject()}
              disabled={
                !transferPreviewData || !transferPreviewData.valid || isTransferring || !selectedOrg
              }
            >
              Transfer Project
            </Button>
          </div>
        }
      >
        <Modal.Content className="text-foreground-light">
          <p className="text-sm">
            To transfer projects, the owner must be a member of both the source and target
            organizations. Consider the following before transferring your project:
          </p>

          <ul className="mt-4 space-y-5 text-sm">
            <li className="flex gap-4">
              <span className="shrink-0 mt-1">
                <Loader />
              </span>
              <div>
                <p className="font-bold">Possible downtime</p>
                <p>
                  There might be a short downtime when transferring projects from a paid to a free
                  organization.
                </p>
              </div>
            </li>

            <li className="flex gap-4">
              <span className="shrink-0 mt-1">
                <Shield />
              </span>
              <div>
                <p className="font-bold">Permissions</p>
                <p>
                  Depending on your role in the target organization, your level of permissions may
                  change after transfer.
                </p>
              </div>
            </li>

            <li className="flex gap-4">
              <span className="shrink-0 mt-1">
                <Wrench size={14} className="flex-shrink-0" />
              </span>
              <div>
                <p className="font-bold">Features</p>
                <p>
                  Moving your project to an organization with a smaller subscription plan may result
                  in the loss of certain features (i.e. image transformations).
                </p>
              </div>
            </li>
          </ul>

          <DocsButton
            abbrev={false}
            className="mt-6"
            href="https://supabase.com/docs/guides/platform/project-transfer"
          />
        </Modal.Content>

        <Modal.Separator />

        <Modal.Content>
          {organizations && (
            <div className="space-y-2">
              {organizations.length === 0 ? (
                <div className="flex items-center gap-3 bg-surface-200 p-3 text-sm rounded-md border">
                  <InfoIcon /> You do not have any organizations with an organization-based
                  subscription.
                </div>
              ) : (
                <Listbox
                  label="Select Target Organization"
                  layout="vertical"
                  value={selectedOrg}
                  onChange={(slug) => setSelectedOrg(slug)}
                  placeholder="Select Organization"
                >
                  <Listbox.Option disabled key="no-results" label="Select Organization" value="">
                    Select Organization
                  </Listbox.Option>
                  {organizations.map((x: any) => (
                    <Listbox.Option
                      key={x.id}
                      label={x.name}
                      value={x.slug}
                      addOnBefore={() => <Users />}
                    >
                      {x.name}
                    </Listbox.Option>
                  ))}
                </Listbox>
              )}
            </div>
          )}
        </Modal.Content>

        {selectedOrg !== undefined && (
          <Loading active={selectedOrg !== undefined && transferPreviewIsLoading}>
            <Modal.Content>
              <div className="space-y-2">
                {transferPreviewData && transferPreviewData.warnings.length > 0 && (
                  <Alert
                    withIcon
                    variant="warning"
                    title="Warnings for project transfer"
                    className="mt-3"
                  >
                    <div className="space-y-1">
                      {transferPreviewData.warnings.map((warning) => (
                        <p key={warning.key}>{warning.message}</p>
                      ))}
                    </div>
                  </Alert>
                )}
                {transferPreviewData && transferPreviewData.errors.length > 0 && (
                  <Alert withIcon variant="danger" title="Project cannot be transferred">
                    <div className="space-y-1">
                      {transferPreviewData.errors.map((error) => (
                        <p key={error.key}>{error.message}</p>
                      ))}
                    </div>
                    {transferPreviewData.members_exceeding_free_project_limit.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-foreground-light">
                          These members have reached their maximum limits for the number of active
                          Free plan projects within organizations where they are an administrator or
                          owner:
                        </p>
                        <ul className="pl-5 text-sm list-disc text-foreground-light">
                          {(transferPreviewData.members_exceeding_free_project_limit || []).map(
                            (member, idx: number) => (
                              <li key={`member-${idx}`}>
                                {member.name} (Limit: {member.limit} free projects)
                              </li>
                            )
                          )}
                        </ul>
                        <p className="text-sm text-foreground-light">
                          These members will need to either delete, pause, or upgrade one or more of
                          their projects before you can downgrade this project.
                        </p>
                      </div>
                    )}
                  </Alert>
                )}
                {transferPreviewError && !transferError && (
                  <Alert withIcon variant="danger" title="Project cannot be transferred">
                    <p>{transferPreviewError.message}</p>
                  </Alert>
                )}
                {transferError && (
                  <Alert withIcon variant="danger" title="Project cannot be transferred">
                    <p>{transferError.message}</p>
                  </Alert>
                )}
              </div>
            </Modal.Content>
          </Loading>
        )}
      </Modal>
    </>
  )
}

export default TransferProjectButton

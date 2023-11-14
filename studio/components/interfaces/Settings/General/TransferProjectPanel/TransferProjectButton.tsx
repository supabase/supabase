import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  IconAlertCircle,
  IconLoader,
  IconShield,
  IconTool,
  IconUsers,
  Listbox,
  Loading,
  Modal,
} from 'ui'

import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectTransferMutation } from 'data/projects/project-transfer-mutation'
import { useProjectTransferPreviewQuery } from 'data/projects/project-transfer-preview-query'
import { useCheckPermissions, useFlag, useSelectedProject, useStore } from 'hooks'

const TransferProjectButton = () => {
  const { ui } = useStore()

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
      ui.setNotification({
        category: 'success',
        duration: 5000,
        message: `Successfully transferred project ${project?.name}.`,
      })
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
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger>
          <Button
            onClick={toggle}
            type="default"
            disabled={!canTransferProject || disableProjectTransfer}
          >
            Transfer project
          </Button>
        </Tooltip.Trigger>
        {(!canTransferProject || disableProjectTransfer) && (
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'rounded bg-alternative py-1 px-2 leading-none shadow', // background
                  'border border-background', //border
                ].join(' ')}
              >
                <span className="text-xs text-foreground">
                  {!canTransferProject
                    ? 'You need additional permissions to transfer this project'
                    : 'Project transfers are temporarily disabled, please try again later.'}
                </span>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        )}
      </Tooltip.Root>

      <Modal
        closable
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
        <div className="space-y-4 py-4 text-foreground-light">
          <Modal.Content>
            <p className="text-sm">
              To transfer projects, the owner must be a member of both the source and target
              organizations. For further information see our{' '}
              <Link
                href="https://supabase.com/docs/guides/platform/project-transfer"
                className="text-brand hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Documentation
              </Link>
              .
            </p>

            <p className="font-bold mt-6 text-sm">Transferring considerations:</p>

            <ul className="mt-4 space-y-5 text-sm px-4">
              <li className="flex gap-4">
                <span className="shrink-0 mt-1">
                  <IconLoader />
                </span>
                <div>
                  <p className="font-bold">No downtime</p>
                  <p>There is no downtime or restrictions involved when transferring a project.</p>
                </div>
              </li>

              <li className="flex gap-4">
                <span className="shrink-0 mt-1">
                  <IconShield />
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
                  <IconTool w={14} className="flex-shrink-0" />
                </span>
                <div>
                  <p className="font-bold">Features</p>
                  <p>
                    Moving your project to an organization with a smaller subscription plan may
                    result in the loss of certain features (i.e. image transformations).
                  </p>
                </div>
              </li>
            </ul>
          </Modal.Content>
          <Modal.Content>
            {organizations && (
              <div className="mt-8 mx-4 border-t pt-4 space-y-2">
                {organizations.length === 0 ? (
                  <div className="flex items-center gap-2 bg-surface-200 p-3 text-sm">
                    <IconAlertCircle /> You do not have any organizations with an organization-based
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
                        addOnBefore={() => <IconUsers />}
                      >
                        {x.name}
                      </Listbox.Option>
                    ))}
                  </Listbox>
                )}

                <p className="text-foreground-light text-sm">
                  The target organization needs to use{' '}
                  <Link
                    href="https://supabase.com/docs/guides/platform/org-based-billing"
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    organization-based billing
                  </Link>
                  . To migrate an organization to the new billing, head to your{' '}
                  <Link
                    href="/org/_/billing"
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    organizations billing settings
                  </Link>
                  .
                </p>
              </div>
            )}
          </Modal.Content>

          <Loading active={selectedOrg !== undefined && transferPreviewIsLoading}>
            <Modal.Content>
              <div className="px-4">
                {transferPreviewData && transferPreviewData.valid && (
                  <div className="text-sm text-foreground-light p-4 bg-surface-200">
                    {transferPreviewData.source_subscription_plan !==
                    transferPreviewData.target_subscription_plan ? (
                      <div>
                        <p>
                          Your project is currently on the{' '}
                          {transferPreviewData.source_subscription_plan} plan, whereas the target
                          organization uses the {transferPreviewData.target_subscription_plan} plan.
                        </p>
                      </div>
                    ) : (
                      <div>
                        Your project and the target organization are both on the{' '}
                        {transferPreviewData.source_subscription_plan} subscription plan.
                      </div>
                    )}

                    <div className="my-4">
                      {transferPreviewData.credits_on_source_organization === 0 ? (
                        <span>
                          {' '}
                          Your current organization won't be granted any prorated credits.
                        </span>
                      ) : (
                        <span>
                          {' '}
                          Your current organization will be granted{' '}
                          <span className="text-brand">
                            ${transferPreviewData.credits_on_source_organization}
                          </span>{' '}
                          in credits as proration.
                        </span>
                      )}
                      {transferPreviewData.costs_on_target_organization === 0 ? (
                        <span>
                          {' '}
                          The target organization won't be charged any immediate upfront payment.
                        </span>
                      ) : (
                        <span>
                          {' '}
                          The target organization will be billed{' '}
                          <span className="text-brand">
                            ${transferPreviewData.costs_on_target_organization}
                          </span>{' '}
                          immediately to prorate for the remainder of the billing period.
                        </span>
                      )}
                    </div>
                  </div>
                )}
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
        </div>
      </Modal>
    </>
  )
}

export default TransferProjectButton

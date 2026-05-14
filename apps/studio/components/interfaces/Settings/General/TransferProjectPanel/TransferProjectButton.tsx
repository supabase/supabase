import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useFlag } from 'common'
import { Loader, Shield, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  InfoIcon,
  Loading,
  Modal,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  WarningIcon,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { DocsButton } from '@/components/ui/DocsButton'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { projectKeys } from '@/data/projects/keys'
import { useProjectTransferMutation } from '@/data/projects/project-transfer-mutation'
import { useProjectTransferPreviewQuery } from '@/data/projects/project-transfer-preview-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'

export const TransferProjectButton = () => {
  const { data: project } = useSelectedProjectQuery()
  const projectRef = project?.ref
  const projectOrgId = project?.organization_id
  const [isOpen, setIsOpen] = useState(false)

  const { data: allOrganizations } = useOrganizationsQuery({ enabled: isOpen })
  const disableProjectTransfer = useFlag('disableProjectTransfer')

  const organizations = (allOrganizations || []).filter((it) => it.id !== projectOrgId)

  const [selectedOrg, setSelectedOrg] = useState<string>()

  const {
    mutate: transferProject,
    error: transferError,
    isPending: isTransferring,
  } = useProjectTransferMutation({
    onSuccess: () => {
      toast.success(`Successfully transferred project ${project?.name}.`)
      setIsOpen(false)
    },
  })

  const {
    data: transferPreviewData,
    error: transferPreviewError,
    isPending: transferPreviewIsLoading,
  } = useProjectTransferPreviewQuery(
    { projectRef, targetOrganizationSlug: selectedOrg },
    { enabled: !isTransferring && isOpen }
  )
  const queryClient = useQueryClient()

  useEffect(() => {
    if (isOpen) {
      // reset state
      setSelectedOrg(undefined)
    } else {
      // Invalidate cache
      queryClient.removeQueries({
        queryKey: projectKeys.projectTransferPreview(projectRef, selectedOrg),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const { can: canTransferProject } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'organizations'
  )

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
                <Wrench size={24} className="shrink-0" />
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
            href={`${DOCS_URL}/guides/platform/project-transfer`}
          />
        </Modal.Content>

        <Modal.Separator />

        <Modal.Content>
          {organizations && (
            <div className="space-y-2">
              {organizations.length === 0 ? (
                <div className="flex items-center gap-3 bg-surface-200 p-3 text-sm rounded-md border">
                  <InfoIcon /> You do not have any organizations you can transfer your project to.
                </div>
              ) : (
                <FormItemLayout
                  id="organization"
                  isReactForm={false}
                  layout="vertical"
                  label="Select Target Organization"
                  className="gap-[2px]"
                  size="tiny"
                >
                  <Select_Shadcn_
                    onValueChange={(slug) => setSelectedOrg(slug)}
                    value={selectedOrg}
                  >
                    <SelectTrigger_Shadcn_ id="organization">
                      <SelectValue_Shadcn_ placeholder="Select Organization" />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {organizations.map((x) => (
                        <SelectItem_Shadcn_ key={x.id} value={x.slug}>
                          {x.name}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                </FormItemLayout>
              )}
            </div>
          )}
        </Modal.Content>

        {selectedOrg !== undefined && (
          <Loading active={selectedOrg !== undefined && transferPreviewIsLoading}>
            <Modal.Content>
              <div className="space-y-2">
                {transferPreviewData && transferPreviewData.errors.length > 0 && (
                  <Admonition type="danger" title="Project cannot be transferred">
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
                          their projects before you can transfer this project.
                        </p>
                      </div>
                    )}
                  </Admonition>
                )}
                {transferPreviewData &&
                  (transferPreviewData.warnings.length > 0 ||
                    transferPreviewData.info.length > 0) && (
                    <Admonition type="caution" showIcon={false} className="mt-3">
                      <div className="flex flex-col gap-y-2">
                        {transferPreviewData.warnings.map((warning) => (
                          <div key={warning.key} className="flex items-center gap-2">
                            <WarningIcon className="shrink-0" />
                            <p className="mb-0.5">{warning.message}</p>
                          </div>
                        ))}
                        {transferPreviewData.info.map((info) => (
                          <div key={info.key} className="flex items-start gap-2">
                            <InfoIcon className="shrink-0 mt-0.5" />
                            <p className="mb-0.5">{info.message}</p>
                          </div>
                        ))}
                      </div>
                    </Admonition>
                  )}
                {transferPreviewError && !transferError && (
                  <Admonition
                    type="danger"
                    title="Project cannot be transferred"
                    description={transferPreviewError.message}
                  />
                )}
                {transferError && (
                  <Admonition
                    type="danger"
                    title="Project cannot be transferred"
                    description={transferError.message}
                  />
                )}
              </div>
            </Modal.Content>
          </Loading>
        )}
      </Modal>
    </>
  )
}

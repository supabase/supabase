import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import Link from 'next/link'
import { useState } from 'react'
import { Button, IconPauseCircle, Modal } from 'ui'

import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'
import { useFreeProjectLimitCheckQuery } from 'data/organizations/free-project-limit-check-query'
import { useProjectRestoreMutation } from 'data/projects/project-restore-mutation'
import { setProjectStatus } from 'data/projects/projects-query'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'
import { useCheckPermissions, useSelectedOrganization, useStore } from 'hooks'
import { PROJECT_STATUS } from 'lib/constants'
import { useProjectContext } from './ProjectContext'

export interface ProjectPausedStateProps {
  product?: string
}

const ProjectPausedState = ({ product }: ProjectPausedStateProps) => {
  const queryClient = useQueryClient()
  const { ui } = useStore()
  const { ref } = useParams()
  const selectedOrganization = useSelectedOrganization()
  const { project } = useProjectContext()
  const orgSlug = selectedOrganization?.slug
  const { data: subscription } = useProjectSubscriptionV2Query({ projectRef: ref })
  const isFreePlan = subscription?.plan?.id === 'free'
  const billedViaOrg = Boolean(selectedOrganization?.subscription_id)

  const { data: membersExceededLimit } = useFreeProjectLimitCheckQuery({ slug: orgSlug })
  const hasMembersExceedingFreeTierLimit = (membersExceededLimit || []).length > 0

  const [showConfirmRestore, setShowConfirmRestore] = useState(false)
  const [showFreeProjectLimitWarning, setShowFreeProjectLimitWarning] = useState(false)

  const { mutate: restoreProject } = useProjectRestoreMutation({
    onSuccess: (res, variables) => {
      setProjectStatus(queryClient, variables.ref, PROJECT_STATUS.RESTORING)
      ui.setNotification({ category: 'success', message: 'Restoring project' })
    },
  })

  const canResumeProject = useCheckPermissions(
    PermissionAction.INFRA_EXECUTE,
    'queue_jobs.projects.initialize_or_resume'
  )

  const onSelectRestore = () => {
    if (!canResumeProject) {
      ui.setNotification({
        category: 'error',
        message: 'You do not have the required permissions to restore this project',
      })
    } else if (hasMembersExceedingFreeTierLimit) setShowFreeProjectLimitWarning(true)
    else setShowConfirmRestore(true)
  }

  const onConfirmRestore = () => {
    if (!project) {
      return ui.setNotification({
        error: 'Project is required',
        category: 'error',
        message: 'Unable to restore: project is required',
      })
    }
    restoreProject({ ref: project.ref })
  }

  return (
    <>
      <div className="space-y-4">
        <div className="w-full mx-auto mb-16 max-w-7xl">
          <div className="mx-6 flex h-[500px] items-center justify-center rounded border border-scale-400 bg-scale-300 p-8">
            <div className="grid w-[480px] gap-4">
              <div className="mx-auto flex max-w-[300px] items-center justify-center space-x-4 lg:space-x-8">
                <IconPauseCircle className="text-scale-1100" size={50} strokeWidth={1.5} />
              </div>

              <div className="space-y-2">
                <p className="text-center">
                  The project "{project?.name ?? ''}" is currently paused.
                </p>
                <p className="text-sm text-scale-1100 text-center">
                  All of your project's data is still intact, but your project is inaccessible while
                  paused.{' '}
                  {product !== undefined ? (
                    <>
                      Restore this project to access the{' '}
                      <span className="text-brand">{product}</span> page
                    </>
                  ) : (
                    'Restore this project and get back to building the next big thing!'
                  )}
                </p>
                {isFreePlan && (
                  <p className="text-sm text-scale-1100 text-center">
                    You can also prevent project pausing in the future by upgrading to Pro.
                  </p>
                )}
                {!isFreePlan && (
                  <p className="text-sm text-scale-1100 text-center">
                    Unpaused projects count towards compute usage. For every hour your instance is
                    active, we'll bill you based on the instance size of your project. See{' '}
                    <Link href="https://supabase.com/docs/guides/platform/org-based-billing#usage-based-billing-for-compute">
                      <a target="_blank" rel="noreferrer" className="underline">
                        Compute Instance Usage Billing
                      </a>
                    </Link>{' '}
                    for more details.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center gap-4">
                <Tooltip.Root delayDuration={0}>
                  <Tooltip.Trigger>
                    <Button
                      size="tiny"
                      type="primary"
                      disabled={!canResumeProject}
                      onClick={onSelectRestore}
                    >
                      Restore project
                    </Button>
                  </Tooltip.Trigger>
                  {!canResumeProject && (
                    <Tooltip.Portal>
                      <Tooltip.Content side="bottom">
                        <Tooltip.Arrow className="radix-tooltip-arrow" />
                        <div
                          className={[
                            'rounded bg-scale-100 py-1 px-2 leading-none shadow', // background
                            'border border-scale-200 ', //border
                          ].join(' ')}
                        >
                          <span className="text-xs text-scale-1200">
                            You need additional permissions to resume this project
                          </span>
                        </div>
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  )}
                </Tooltip.Root>
                {isFreePlan ? (
                  <Link
                    href={
                      billedViaOrg
                        ? `/org/${orgSlug}/billing?panel=subscriptionPlan`
                        : `/project/${ref}/settings/billing/subscription?panel=subscriptionPlan`
                    }
                  >
                    <a>
                      <Button type="default">Upgrade to Pro</Button>
                    </a>
                  </Link>
                ) : (
                  <Link href={`/project/${ref}/settings/general`}>
                    <a>
                      <Button type="default">View project settings</Button>
                    </a>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal
        visible={showConfirmRestore}
        title="Restore this project"
        description="Confirm to restore this project? Your project's data will be restored to when it was initially paused."
        buttonLabel="Restore project"
        buttonLoadingLabel="Restoring project"
        onSelectCancel={() => setShowConfirmRestore(false)}
        onSelectConfirm={onConfirmRestore}
      />
      <Modal
        hideFooter
        visible={showFreeProjectLimitWarning}
        size="medium"
        header="Your organization has members who have exceeded their free project limits"
        onCancel={() => setShowFreeProjectLimitWarning(false)}
      >
        <div className="py-4 space-y-4">
          <Modal.Content>
            <div className="space-y-2">
              <p className="text-sm text-scale-1100">
                The following members have reached their maximum limits for the number of active
                free plan projects within organizations where they are an administrator or owner:
              </p>
              <ul className="pl-5 text-sm list-disc text-scale-1100">
                {(membersExceededLimit || []).map((member, idx: number) => (
                  <li key={`member-${idx}`}>
                    {member.username || member.primary_email} (Limit: {member.free_project_limit}{' '}
                    free projects)
                  </li>
                ))}
              </ul>
              <p className="text-sm text-scale-1100">
                These members will need to either delete, pause, or upgrade one or more of these
                projects before you're able to unpause this project.
              </p>
            </div>
          </Modal.Content>
          <Modal.Separator />
          <Modal.Content>
            <div className="flex items-center gap-2">
              <Button
                htmlType="button"
                type="default"
                onClick={() => setShowFreeProjectLimitWarning(false)}
                block
              >
                Understood
              </Button>
            </div>
          </Modal.Content>
        </div>
      </Modal>
    </>
  )
}

export default ProjectPausedState

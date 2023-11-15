import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Button, Input } from 'ui'

import { CANCELLATION_REASONS } from 'components/interfaces/Billing/Billing.constants'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import TextConfirmModal from 'components/ui/Modals/TextConfirmModal'
import { useSendDowngradeFeedbackMutation } from 'data/feedback/exit-survey-send'
import { useProjectDeleteMutation } from 'data/projects/project-delete-mutation'
import { useCheckPermissions, useSelectedOrganization, useStore } from 'hooks'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'

export interface DeleteProjectButtonProps {
  type?: 'danger' | 'default'
}

const DeleteProjectButton = ({ type = 'danger' }: DeleteProjectButtonProps) => {
  const router = useRouter()
  const { ui } = useStore()
  const { project } = useProjectContext()
  const organization = useSelectedOrganization()

  const projectRef = project?.ref
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })
  const projectPlan = subscription?.plan?.id ?? 'free'
  const isFree = projectPlan === 'free'

  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])

  const { mutateAsync: deleteProject, isLoading: isDeleting } = useProjectDeleteMutation()
  const { mutateAsync: sendExitSurvey, isLoading: isSending } = useSendDowngradeFeedbackMutation()
  const isSubmitting = isDeleting || isSending

  useEffect(() => {
    if (isOpen) {
      setSelectedReasons([])
      setMessage('')
    }
  }, [isOpen])

  const canDeleteProject = useCheckPermissions(PermissionAction.UPDATE, 'projects', {
    resource: {
      project_id: project?.id,
    },
  })

  const toggle = () => {
    if (isSubmitting) return
    setIsOpen(!isOpen)
  }

  const onSelectCancellationReason = (reason: string) => {
    const existingSelection = selectedReasons.find((x) => x === reason)
    const updatedSelection =
      existingSelection === undefined
        ? selectedReasons.concat([reason])
        : selectedReasons.filter((x) => x !== reason)
    setSelectedReasons(updatedSelection)
  }

  async function handleDeleteProject() {
    if (project === undefined) return

    if (!isFree && selectedReasons.length === 0) {
      return ui.setNotification({
        category: 'error',
        duration: 4000,
        message: 'Please select at least one reason for deleting your project',
      })
    }

    try {
      await deleteProject({ projectRef: project.ref })

      if (!isFree) {
        await sendExitSurvey({
          projectRef,
          message,
          reasons: selectedReasons.reduce((a, b) => `${a}- ${b}\n`, ''),
          exitAction: 'delete',
        })
      }

      ui.setNotification({ category: 'success', message: `Successfully deleted ${project.name}` })
      router.push(`/projects`)
    } finally {
    }
  }

  return (
    <>
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger>
          <Button onClick={toggle} type={type} disabled={!canDeleteProject}>
            Delete project
          </Button>
        </Tooltip.Trigger>
        {!canDeleteProject && (
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
                  You need additional permissions to delete this project
                </span>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        )}
      </Tooltip.Root>
      <TextConfirmModal
        visible={isOpen}
        loading={isSubmitting}
        size={isFree ? 'small' : 'xlarge'}
        title={`Confirm deletion of ${project?.name}`}
        alert={
          isFree
            ? 'This action cannot be undone.'
            : `This will permanently delete the ${project?.name} project and all of its data, and cannot be undone`
        }
        text={
          isFree
            ? `This will permanently delete the ${project?.name} project and all of its data.`
            : undefined
        }
        confirmPlaceholder="Type the project name in here"
        confirmString={project?.name || ''}
        confirmLabel="I understand, delete this project"
        onConfirm={handleDeleteProject}
        onCancel={toggle}
      >
        {/* 
          [Joshen] This is basically ExitSurvey.tsx, ideally we have one shared component but the one
          in ExitSurvey has a Form wrapped around it already. Will probably need some effort to refactor
          but leaving that for the future.
        */}
        {!isFree && (
          <>
            <div className="space-y-1">
              <h4 className="text-base">We're sad that you're leaving.</h4>
              <p className="text-sm text-foreground-light">
                We always strive to improve Supabase as much as we can. Please let us know the
                reasons you are deleting your project so that we can improve in the future.
              </p>
            </div>
            <div className="space-y-4 pt-4">
              <div className="flex flex-wrap gap-2" data-toggle="buttons">
                {CANCELLATION_REASONS.map((option) => {
                  const active = selectedReasons.find((x) => x === option)
                  return (
                    <label
                      key={option}
                      className={[
                        'flex cursor-pointer items-center space-x-2 rounded-md py-1',
                        'pl-2 pr-3 text-center text-sm shadow-sm transition-all duration-100',
                        `${
                          active
                            ? ` bg-foreground text-background opacity-100 hover:bg-opacity-75`
                            : ` bg-border-strong text-foreground opacity-25 hover:opacity-50`
                        }`,
                      ].join(' ')}
                    >
                      <input
                        type="checkbox"
                        name="options"
                        value={option}
                        className="hidden"
                        onClick={(event: any) => onSelectCancellationReason(event.target.value)}
                      />
                      <div>{option}</div>
                    </label>
                  )
                })}
              </div>
              <div className="text-area-text-sm">
                <Input.TextArea
                  name="message"
                  label="Anything else that we can improve on?"
                  rows={3}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
              </div>
            </div>
          </>
        )}
      </TextConfirmModal>
    </>
  )
}

export default DeleteProjectButton

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { CANCELLATION_REASONS } from 'components/interfaces/Billing/Billing.constants'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useSendDowngradeFeedbackMutation } from 'data/feedback/exit-survey-send'
import { useProjectDeleteMutation } from 'data/projects/project-delete-mutation'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { Input } from 'ui'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'

const DeleteProjectModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const router = useRouter()
  const { project } = useProjectContext()
  const organization = useSelectedOrganization()

  const projectRef = project?.ref
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })
  const projectPlan = subscription?.plan?.id ?? 'free'
  const isFree = projectPlan === 'free'

  const [message, setMessage] = useState<string>('')
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])

  const { mutate: deleteProject, isLoading: isDeleting } = useProjectDeleteMutation({
    onSuccess: async () => {
      if (!isFree) {
        try {
          await sendExitSurvey({
            projectRef,
            message,
            reasons: selectedReasons.reduce((a, b) => `${a}- ${b}\n`, ''),
            exitAction: 'delete',
          })
        } catch (error) {
          // [Joshen] In this case we don't raise any errors if the exit survey fails to send since it shouldn't block the user
        }
      }

      toast.success(`Successfully deleted ${project?.name}`)
      router.push(`/projects`)
    },
  })
  const { mutateAsync: sendExitSurvey, isLoading: isSending } = useSendDowngradeFeedbackMutation()
  const isSubmitting = isDeleting || isSending

  useEffect(() => {
    if (visible) {
      setSelectedReasons([])
      setMessage('')
    }
  }, [visible])

  const canDeleteProject = useCheckPermissions(PermissionAction.UPDATE, 'projects', {
    resource: {
      project_id: project?.id,
    },
  })

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
      return toast.error('Please select at least one reason for deleting your project')
    }

    deleteProject({ projectRef: project.ref, organizationSlug: organization?.slug })
  }

  return (
    <>
      <TextConfirmModal
        visible={visible}
        loading={isSubmitting}
        size={isFree ? 'small' : 'medium'}
        title={`Confirm deletion of ${project?.name}`}
        variant="destructive"
        alert={{
          title: isFree
            ? 'This action cannot be undone.'
            : `This will permanently delete the ${project?.name}`,
          description: !isFree ? `All project data will be lost, and cannot be undone` : '',
        }}
        text={
          isFree
            ? `This will permanently delete the ${project?.name} project and all of its data.`
            : undefined
        }
        confirmPlaceholder="Type the project name in here"
        confirmString={project?.name || ''}
        confirmLabel="I understand, delete this project"
        onConfirm={handleDeleteProject}
        onCancel={() => {
          if (!isSubmitting) onClose()
        }}
      >
        {/* 
          [Joshen] This is basically ExitSurvey.tsx, ideally we have one shared component but the one
          in ExitSurvey has a Form wrapped around it already. Will probably need some effort to refactor
          but leaving that for the future.
        */}
        {!isFree && (
          <>
            <div className="space-y-1">
              <h4 className="text-base">Help us improve.</h4>
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

export default DeleteProjectModal

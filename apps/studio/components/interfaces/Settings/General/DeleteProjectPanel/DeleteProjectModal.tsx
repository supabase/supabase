import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, cn, TextArea } from 'ui'
import { CollapsibleCardSection } from 'ui-patterns/CollapsibleCardSection'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { CANCELLATION_REASONS } from '@/components/interfaces/Billing/Billing.constants'
import { LogicalBackupCliInstructions } from '@/components/layouts/ProjectLayout/LogicalBackupCliInstructions'
import { InlineLink } from '@/components/ui/InlineLink'
import { TextConfirmModal } from '@/components/ui/TextConfirmModalWrapper'
import { useSendDowngradeFeedbackMutation } from '@/data/feedback/exit-survey-send'
import type { OrgProject } from '@/data/projects/org-projects-infinite-query'
import { useProjectDeleteMutation } from '@/data/projects/project-delete-mutation'
import { useOrgSubscriptionQuery } from '@/data/subscriptions/org-subscription-query'
import { useLastVisitedOrganization } from '@/hooks/misc/useLastVisitedOrganization'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'
import type { Organization } from '@/types'

export const DeleteProjectModal = ({
  visible,
  onClose,
  project: projectProp,
  organization: organizationProp,
}: {
  visible: boolean
  onClose: () => void
  project?: OrgProject
  organization?: Organization
}) => {
  const router = useRouter()
  const { data: projectFromQuery } = useSelectedProjectQuery()
  const { data: organizationFromQuery } = useSelectedOrganizationQuery()

  // Use props if provided, otherwise fall back to hooks
  const project = projectProp || projectFromQuery
  const organization = organizationProp || organizationFromQuery

  const { lastVisitedOrganization } = useLastVisitedOrganization()

  const projectRef = project?.ref
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })
  const projectPlan = subscription?.plan?.id ?? 'free'
  const shouldShowExitSurvey = ['pro', 'team'].includes(projectPlan)

  const [message, setMessage] = useState<string>('')
  const [selectedReason, setSelectedReason] = useState<string[]>([])

  // Single select for cancellation reason
  const onSelectCancellationReason = (reason: string) => {
    setSelectedReason([reason])
  }

  // Helper to get label for selected reason
  const getReasonLabel = (reason: string | undefined) => {
    const found = CANCELLATION_REASONS.find((r) => r.value === reason)
    return found?.label || 'What can we improve on?'
  }

  const textareaLabel = getReasonLabel(selectedReason[0])

  const [shuffledReasons] = useState(() => [
    ...CANCELLATION_REASONS.sort(() => Math.random() - 0.5),
    { value: 'None of the above' },
  ])

  const { mutate: deleteProject, isPending: isDeleting } = useProjectDeleteMutation({
    onSuccess: async () => {
      toast.success(`Successfully deleted ${project?.name}`)

      // Only redirect if still viewing the deleted project
      if (router.asPath.startsWith(`/project/${projectRef}`)) {
        if (lastVisitedOrganization) {
          router.push(`/org/${lastVisitedOrganization}`)
        } else {
          router.push('/organizations')
        }
      }
    },
  })
  const { mutateAsync: sendExitSurvey, isPending: isSending } = useSendDowngradeFeedbackMutation({
    // The user should not get a toast saying "submitting survey failed"
    onError: () => {},
  })
  const isSubmitting = isDeleting || isSending

  async function handleDeleteProject() {
    if (project === undefined) return
    if (shouldShowExitSurvey && selectedReason.length === 0) {
      return toast.error('Please select a reason for deleting your project')
    }

    if (shouldShowExitSurvey) {
      // The survey must be sent before the delete: deleting the project removes its permissions,
      // so the survey endpoint would reject the request afterwards.
      try {
        await sendExitSurvey({
          orgSlug: organization?.slug,
          projectRef: project.ref,
          message,
          reasons: selectedReason.reduce((a, b) => `${a}- ${b}\n`, ''),
          exitAction: 'delete',
        })
      } catch {
        // A failed survey should never block the user from deleting their project
      }
    }

    deleteProject({ projectRef: project.ref, organizationSlug: organization?.slug })
  }

  useEffect(() => {
    if (visible) {
      setSelectedReason([])
      setMessage('')
    }
  }, [visible])

  return (
    <TextConfirmModal
      visible={visible}
      loading={isSubmitting}
      size={shouldShowExitSurvey ? 'xlarge' : 'medium'}
      title={`Confirm deletion of ${project?.name}`}
      variant="destructive"
      alert={{
        title: shouldShowExitSurvey
          ? `This will permanently delete the ${project?.name}`
          : 'This action cannot be undone.',
        description: (
          <>
            {shouldShowExitSurvey
              ? 'All project data will be lost, and cannot be undone. '
              : `This will permanently delete the ${project?.name} project and all of its data. `}
            Read the{' '}
            <InlineLink href={`${DOCS_URL}/guides/platform/delete-project`}>
              documentation
            </InlineLink>{' '}
            for prerequisites, implications, and recovery information.
          </>
        ),
      }}
      confirmPlaceholder="Type the project name in here"
      confirmString={project?.name || ''}
      confirmLabel="I understand, delete this project"
      onConfirm={handleDeleteProject}
      onCancel={() => {
        if (!isSubmitting) onClose()
      }}
    >
      <div className="space-y-6">
        <Card>
          <CardContent
            className={cn(
              '[&>div>button]:tracking-normal',
              '[&>div>button]:text-foreground [&>div>button]:hover:text-foreground',
              '[&>div>button]:data-open:text-foreground [&>div>button]:text-sm'
            )}
          >
            <CollapsibleCardSection title="Back up your database with the Supabase CLI">
              <LogicalBackupCliInstructions enabled={visible} showResetPassword={false} />
            </CollapsibleCardSection>
          </CardContent>
        </Card>

        {/*
          [Joshen] This is basically ExitSurvey.tsx, ideally we have one shared component but the one
          in ExitSurvey has a Form wrapped around it already. Will probably need some effort to refactor
          but leaving that for the future.
        */}
        {shouldShowExitSurvey && (
          <div className="flex flex-col gap-y-6">
            <FormItemLayout
              isReactForm={false}
              label="What made you decide to delete your project?"
            >
              <div className="flex flex-wrap gap-2" data-toggle="buttons">
                {shuffledReasons.map((option) => {
                  const active = selectedReason[0] === option.value
                  return (
                    <label
                      key={option.value}
                      className={[
                        'flex cursor-pointer items-center space-x-2 rounded-md py-1',
                        'pl-2 pr-3 text-center text-sm shadow-xs transition-all duration-100',
                        `${
                          active
                            ? ` bg-foreground text-background opacity-100 hover:bg-foreground/75`
                            : ` bg-border-strong text-foreground opacity-50 hover:opacity-75`
                        }`,
                      ].join(' ')}
                    >
                      <input
                        aria-label="reasons"
                        type="radio"
                        name="options"
                        value={option.value}
                        className="hidden"
                        checked={active}
                        onChange={() => onSelectCancellationReason(option.value)}
                      />
                      <div>{option.value}</div>
                    </label>
                  )
                })}
              </div>
            </FormItemLayout>

            <FormItemLayout isReactForm={false} label={textareaLabel}>
              <TextArea
                autoFocus
                name="message"
                rows={3}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </FormItemLayout>
          </div>
        )}
      </div>
    </TextConfirmModal>
  )
}

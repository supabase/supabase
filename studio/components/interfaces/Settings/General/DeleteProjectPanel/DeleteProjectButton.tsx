import { FC, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Button, Input } from 'ui'
import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useStore, checkPermissions } from 'hooks'
import { API_URL, PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import { delete_, post } from 'lib/common/fetch'
import TextConfirmModal from 'components/ui/Modals/TextConfirmModal'
import { CANCELLATION_REASONS } from 'components/interfaces/Billing/Billing.constants'

interface Props {
  type?: 'danger' | 'default'
}

const DeleteProjectButton: FC<Props> = ({ type = 'danger' }) => {
  const router = useRouter()
  const { app, ui } = useStore()

  const project = ui.selectedProject
  const projectRef = project?.ref
  const projectTier = project?.subscription_tier ?? PRICING_TIER_PRODUCT_IDS.FREE
  const isFree = projectTier === PRICING_TIER_PRODUCT_IDS.FREE

  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [cancellationMessage, setCancellationMessage] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      setSelectedReasons([])
      setCancellationMessage('')
    }
  }, [isOpen])

  const canDeleteProject = checkPermissions(PermissionAction.UPDATE, 'projects')

  const toggle = () => {
    if (loading) return
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

    setLoading(true)
    try {
      const response = await delete_(`${API_URL}/projects/${projectRef}`)
      if (response.error) throw response.error
      app.onProjectDeleted(response)
      ui.setNotification({ category: 'success', message: `Successfully deleted ${project.name}` })
      router.push(`/projects`)
    } catch (error: any) {
      setLoading(false)
      ui.setNotification({
        category: 'error',
        message: `Failed to delete project ${project.name}: ${error.message}`,
      })
    }

    // Submit exit survey to Hubspot for paid projects
    if (!isFree) {
      const feedbackRes = await post(`${API_URL}/feedback/downgrade`, {
        projectRef,
	reasons: selectedReasons.reduce((a, b) => `${a}- ${b}\n`, ''),
	additionalFeedback: cancellationMessage,
	exitAction: 'delete',
      })
      if (feedbackRes.error) throw feedbackRes.error
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
          <Tooltip.Content side="bottom">
            <Tooltip.Arrow className="radix-tooltip-arrow" />
            <div
              className={[
                'rounded bg-scale-100 py-1 px-2 leading-none shadow', // background
                'border border-scale-200 ', //border
              ].join(' ')}
            >
              <span className="text-xs text-scale-1200">
                You need additional permissions to delete this project
              </span>
            </div>
          </Tooltip.Content>
        )}
      </Tooltip.Root>
      <TextConfirmModal
        visible={isOpen}
        loading={loading}
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
              <p className="text-sm text-scale-1100">
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
                            ? ` bg-scale-1200 text-scale-100 opacity-100 hover:bg-opacity-75`
                            : ` bg-scale-700 text-scale-1200 opacity-25 hover:opacity-50`
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
                  value={cancellationMessage}
                  onChange={(event) => setCancellationMessage(event.target.value)}
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

import * as Sentry from '@sentry/nextjs'
import { useFlag } from 'common'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useReducer } from 'react'
import { toast } from 'sonner'
import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { IncidentAdmonition } from './IncidentAdmonition'
import { Success } from './Success'
import type { ExtendedSupportCategories } from './Support.constants'
import { SupportAssistantSuccessCard } from './SupportAssistantSuccessCard'
import { createInitialSupportFormState, supportFormReducer } from './SupportForm.state'
import { NO_PROJECT_MARKER, type SupportFormUrlKeys } from './SupportForm.utils'
import { SupportFormV3 } from './SupportFormV3'
import { DEFAULT_STATUS_PAGE_URL, getSupportStatusLabel } from './SupportStatus.utils'
import { useSupportForm } from './useSupportForm'
import { useSupportStatus } from './useSupportStatus'
import { useStateTransition } from '@/hooks/misc/useStateTransition'
import { useTrack } from '@/lib/telemetry/track'

function useSupportFormTelemetry() {
  const track = useTrack()

  return useCallback(
    ({
      projectRef,
      orgSlug,
      category,
    }: {
      projectRef: string | undefined
      orgSlug: string | undefined
      category: ExtendedSupportCategories
    }) =>
      track(
        'support_ticket_submitted',
        { ticketCategory: category },
        { project: projectRef, organization: orgSlug }
      ),
    [track]
  )
}

interface SupportFormProps {
  initialParams?: Partial<SupportFormUrlKeys>
}

export function SupportForm({ initialParams }: SupportFormProps) {
  const [state, dispatch] = useReducer(supportFormReducer, undefined, createInitialSupportFormState)
  const { form, initialError, projectRef } = useSupportForm(dispatch, initialParams)
  const showSupportAssistantFollowUp = useFlag('supportAssistantFollowUp') === true

  const supportStatus = useSupportStatus()
  const admonition = supportStatus.status === 'success' ? supportStatus.admonition : null
  const statusPageUrl =
    supportStatus.status === 'success' ? supportStatus.pageUrl : DEFAULT_STATUS_PAGE_URL

  const sendTelemetry = useSupportFormTelemetry()
  useStateTransition(state, 'submitting', 'success', (_, curr) => {
    toast.success('Support request sent. Thank you!')
    sendTelemetry({
      projectRef: curr.sentProjectRef,
      orgSlug: curr.sentOrgSlug,
      category: curr.sentCategory,
    })
  })

  useStateTransition(state, 'submitting', 'error', (_, curr) => {
    toast.error(`Failed to submit support ticket: ${curr.message}`)
    if (curr.code !== 429) {
      Sentry.captureMessage(`Failed to submit Support Form: ${curr.message}`)
    }
    dispatch({ type: 'RETURN_TO_EDITING' })
  })

  const successState = state.type === 'success' ? state : null
  const showAssistantSuccessCard =
    showSupportAssistantFollowUp &&
    successState !== null &&
    successState.submittedRequest.projectRef !== undefined &&
    successState.submittedRequest.projectRef !== NO_PROJECT_MARKER

  return (
    <div className="relative h-full overflow-y-auto overflow-x-hidden">
      <IncidentAdmonition
        isActive={admonition !== null}
        title={admonition?.title ?? ''}
        description={admonition?.description ?? ''}
        statusPageUrl={statusPageUrl}
        className="rounded-none border-x-0 shadow-none"
      />
      <div className="min-h-full px-5 pt-5">
        <div className="flex flex-col gap-y-8">
          {successState ? (
            <div className="flex flex-col gap-y-8 pt-2">
              <Success
                selectedProject={
                  successState.sentProjectRef === undefined
                    ? (projectRef ?? undefined)
                    : successState.sentProjectRef
                }
                sentCategory={successState.sentCategory}
                showFinishAction={false}
              />
              {showAssistantSuccessCard && (
                <SupportAssistantSuccessCard request={successState.submittedRequest} />
              )}
            </div>
          ) : (
            <SupportFormV3
              form={form}
              initialError={initialError}
              state={state}
              dispatch={dispatch}
              selectedProjectRef={projectRef}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export function SupportFormStatusButton() {
  const supportStatus = useSupportStatus()
  const isLoading = supportStatus.status === 'pending'
  const isIncident = supportStatus.status === 'success' && supportStatus.hasActiveIncidents
  const statusPageUrl =
    supportStatus.status === 'success' ? supportStatus.pageUrl : DEFAULT_STATUS_PAGE_URL

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          asChild
          size="tiny"
          icon={
            isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  isIncident ? 'bg-warning' : 'bg-brand-default'
                )}
              />
            )
          }
        >
          <Link href={statusPageUrl} target="_blank" rel="noreferrer">
            {getSupportStatusLabel(supportStatus)}
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="center">
        Check the Supabase status page
      </TooltipContent>
    </Tooltip>
  )
}

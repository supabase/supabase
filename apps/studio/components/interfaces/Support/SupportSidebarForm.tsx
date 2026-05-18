import * as Sentry from '@sentry/nextjs'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useReducer } from 'react'
import { toast } from 'sonner'
import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { IncidentAdmonition } from './IncidentAdmonition'
import { Success } from './Success'
import type { ExtendedSupportCategories } from './Support.constants'
import { createInitialSupportFormState, supportFormReducer } from './SupportForm.state'
import type { SupportFormUrlKeys } from './SupportForm.utils'
import { SupportFormV3 } from './SupportFormV3'
import { useSupportForm } from './useSupportForm'
import { useIncidentStatusQuery } from '@/data/platform/incident-status-query'
import { useSendEventMutation } from '@/data/telemetry/send-event-mutation'
import { useStateTransition } from '@/hooks/misc/useStateTransition'

function useSupportFormTelemetry() {
  const { mutate: sendEvent } = useSendEventMutation()

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
      sendEvent({
        action: 'support_ticket_submitted',
        properties: {
          ticketCategory: category,
        },
        groups: {
          project: projectRef,
          organization: orgSlug,
        },
      }),
    [sendEvent]
  )
}

interface SupportFormProps {
  initialParams?: Partial<SupportFormUrlKeys>
  onFinish?: () => void
}

export function SupportForm({ initialParams, onFinish }: SupportFormProps) {
  const [state, dispatch] = useReducer(supportFormReducer, undefined, createInitialSupportFormState)
  const { form, initialError, projectRef } = useSupportForm(dispatch, initialParams)

  const {
    data: allStatusPageEvents,
    isPending: isIncidentsPending,
    isError: isIncidentsError,
  } = useIncidentStatusQuery()
  const { incidents = [] } = allStatusPageEvents ?? {}
  const hasActiveIncidents =
    !isIncidentsPending && !isIncidentsError && incidents && incidents.length > 0

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
    Sentry.captureMessage(`Failed to submit Support Form: ${curr.message}`)
    dispatch({ type: 'RETURN_TO_EDITING' })
  })

  const isSuccess = state.type === 'success'

  return (
    <div className="relative h-full overflow-y-auto overflow-x-hidden">
      <IncidentAdmonition
        isActive={hasActiveIncidents}
        className="rounded-none border-x-0 shadow-none"
      />
      <div className="min-h-full px-5 pt-5">
        <div className="flex flex-col gap-y-8">
          {isSuccess ? (
            <div className="pt-2">
              <Success
                selectedProject={projectRef ?? undefined}
                sentCategory={state.sentCategory}
                onFinish={onFinish}
                finishLabel={onFinish ? 'Done' : undefined}
              />
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
  const { data: allStatusPageEvents, isPending: isLoading, isError } = useIncidentStatusQuery()
  const { incidents = [], maintenanceEvents = [] } = allStatusPageEvents ?? {}
  const isMaintenance = maintenanceEvents.length > 0
  const isIncident = incidents.length > 0

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          asChild
          type="default"
          size="tiny"
          icon={
            isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <div className={cn('h-2 w-2 rounded-full', isIncident ? 'bg-warning' : 'bg-brand')} />
            )
          }
        >
          <Link href="https://status.supabase.com/" target="_blank" rel="noreferrer">
            {isLoading
              ? 'Checking status'
              : isError
                ? 'Failed to check status'
                : isIncident
                  ? 'Active incident ongoing'
                  : isMaintenance
                    ? 'Scheduled maintenance'
                    : 'All systems operational'}
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="center">
        Check the Supabase status page
      </TooltipContent>
    </Tooltip>
  )
}

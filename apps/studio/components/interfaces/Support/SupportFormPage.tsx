import * as Sentry from '@sentry/nextjs'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useReducer, type Dispatch, type PropsWithChildren } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { AIAssistantOption } from './AIAssistantOption'
import { DiscordCTACard } from './DiscordCTACard'
import { IncidentAdmonition } from './IncidentAdmonition'
import { Success } from './Success'
import type { ExtendedSupportCategories } from './Support.constants'
import type { SupportFormValues } from './SupportForm.schema'
import {
  createInitialSupportFormState,
  supportFormReducer,
  type SupportFormActions,
  type SupportFormState,
} from './SupportForm.state'
import type { SupportFormUrlKeys } from './SupportForm.utils'
import { SupportFormV2 } from './SupportFormV2'
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

export function SupportFormPage() {
  return <SupportForm />
}

interface SupportFormProps {
  initialParams?: Partial<SupportFormUrlKeys>
  layout?: 'page' | 'sidebar'
}

export function SupportForm({ initialParams, layout = 'page' }: SupportFormProps) {
  const [state, dispatch] = useReducer(supportFormReducer, undefined, createInitialSupportFormState)
  const { form, initialError, projectRef, orgSlug } = useSupportForm(dispatch, initialParams)

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
  const mainContent = (
    <>
      {/* Only show AI Assistant and Discord CTAs if there are no active incidents  and the user is still filling out the support form*/}
      {!isSuccess && !hasActiveIncidents && (
        <div className="flex flex-col gap-y-4">
          <AIAssistantOption projectRef={projectRef} organizationSlug={orgSlug} />
          <DiscordCTACard organizationSlug={orgSlug} />
        </div>
      )}

      <SupportFormBody
        form={form}
        state={state}
        dispatch={dispatch}
        initialError={initialError}
        selectedProjectRef={projectRef}
        layout={layout}
      />
    </>
  )

  return (
    <SupportFormWrapper layout={layout}>
      {layout === 'sidebar' ? (
        <>
          <IncidentAdmonition
            isActive={hasActiveIncidents}
            className="rounded-none border-x-0 shadow-none"
          />
          <div className="px-5 pt-5">
            <div className="flex flex-col gap-y-8">{mainContent}</div>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-y-8">
          <IncidentAdmonition isActive={hasActiveIncidents} />
          {mainContent}
        </div>
      )}
    </SupportFormWrapper>
  )
}

function SupportFormWrapper({
  children,
  layout,
}: PropsWithChildren<{ layout: SupportFormProps['layout'] }>) {
  return (
    <div className="relative h-full overflow-y-auto overflow-x-hidden">
      <div
        className={cn(
          'w-full',
          layout === 'page' ? 'mx-auto my-16 max-w-2xl px-4 lg:px-6' : 'min-h-full'
        )}
      >
        {children}
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

interface SupportFromBodyProps {
  form: UseFormReturn<SupportFormValues>
  state: SupportFormState
  dispatch: Dispatch<SupportFormActions>
  initialError: string | null
  selectedProjectRef: string | null
  layout: SupportFormProps['layout']
}

function SupportFormBody({
  form,
  state,
  dispatch,
  initialError,
  selectedProjectRef,
  layout,
}: SupportFromBodyProps) {
  const isSuccess = state.type === 'success'

  if (layout === 'sidebar') {
    return isSuccess ? (
      <div className="pt-2">
        <Success
          selectedProject={selectedProjectRef ?? undefined}
          sentCategory={state.sentCategory}
        />
      </div>
    ) : (
      <SupportFormV2
        form={form}
        initialError={initialError}
        state={state}
        dispatch={dispatch}
        layout={layout}
        selectedProjectRef={selectedProjectRef}
      />
    )
  }

  return (
    <div
      className={cn(
        'min-w-full w-full space-y-12 border bg-panel-body-light',
        layout === 'page' ? 'rounded shadow-md' : 'rounded shadow-sm',
        `${isSuccess ? 'pt-8' : 'py-8'}`,
        'border-default'
      )}
    >
      {isSuccess ? (
        <Success
          selectedProject={selectedProjectRef ?? undefined}
          sentCategory={state.sentCategory}
        />
      ) : (
        <SupportFormV2
          form={form}
          initialError={initialError}
          state={state}
          dispatch={dispatch}
          layout={layout}
          selectedProjectRef={selectedProjectRef}
        />
      )}
    </div>
  )
}

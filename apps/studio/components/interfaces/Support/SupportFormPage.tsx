import * as Sentry from '@sentry/nextjs'
import CopyButton from 'components/ui/CopyButton'
import { useIncidentStatusQuery } from 'data/platform/incident-status-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useStateTransition } from 'hooks/misc/useStateTransition'
import { BASE_PATH, DOCS_URL } from 'lib/constants'
import { Loader2, Wrench } from 'lucide-react'
import Link from 'next/link'
import { type Dispatch, type PropsWithChildren, useCallback, useReducer } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import SVG from 'react-inlinesvg'
import { toast } from 'sonner'
import { Button, Tooltip, TooltipContent, TooltipTrigger, cn } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { AIAssistantOption } from './AIAssistantOption'
import { DiscordCTACard } from './DiscordCTACard'
import { IncidentAdmonition } from './IncidentAdmonition'
import { Success } from './Success'
import type { ExtendedSupportCategories } from './Support.constants'
import type { SupportFormValues } from './SupportForm.schema'
import {
  type SupportFormActions,
  type SupportFormState,
  createInitialSupportFormState,
  supportFormReducer,
} from './SupportForm.state'
import { NO_PROJECT_MARKER } from './SupportForm.utils'
import { SupportFormV2 } from './SupportFormV2'
import { useSupportForm } from './useSupportForm'

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
  return <SupportFormPageContent />
}

function SupportFormPageContent() {
  const [state, dispatch] = useReducer(supportFormReducer, undefined, createInitialSupportFormState)
  const { form, initialError, projectRef, orgSlug } = useSupportForm(dispatch)

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
    <SupportFormWrapper>
      <SupportFormHeader />

      <IncidentAdmonition isActive={hasActiveIncidents} />

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
      />
      {!isSuccess && <SupportFormDirectEmailInfo projectRef={projectRef} />}
    </SupportFormWrapper>
  )
}

function SupportFormWrapper({ children }: PropsWithChildren) {
  return (
    <div className="relative overflow-y-auto overflow-x-hidden">
      <div className="mx-auto my-16 max-w-2xl w-full px-4 lg:px-6">
        <div className="flex flex-col gap-y-8">{children}</div>
      </div>
    </div>
  )
}

function SupportFormHeader() {
  const { data: allStatusPageEvents, isPending: isLoading, isError } = useIncidentStatusQuery()
  const { incidents = [], maintenanceEvents = [] } = allStatusPageEvents ?? {}
  const isMaintenance = maintenanceEvents.length > 0
  const isIncident = incidents.length > 0

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-y-2">
      <div className="flex items-center space-x-3">
        <SVG src={`${BASE_PATH}/img/supabase-logo.svg`} className="h-4 w-4" />
        <h3 className="m-0 text-lg">Supabase support</h3>
      </div>

      <div className="flex items-center gap-x-3">
        <Button asChild type="default" icon={<Wrench />}>
          <Link
            href={`${DOCS_URL}/guides/troubleshooting?products=platform`}
            target="_blank"
            rel="noreferrer"
          >
            Troubleshooting
          </Link>
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              type="default"
              icon={
                isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <div
                    className={cn('h-2 w-2 rounded-full', isIncident ? 'bg-warning' : 'bg-brand')}
                  />
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
      </div>
    </div>
  )
}

interface SupportFormDirectEmailInfoProps {
  projectRef: string | null
}

function SupportFormDirectEmailInfo({ projectRef }: SupportFormDirectEmailInfoProps) {
  const hasProjectRef = projectRef && projectRef !== NO_PROJECT_MARKER

  return (
    <Admonition
      type="default"
      title="Having trouble submitting the form?"
      description={
        <>
          <p className="!mb-2.5">
            Please email us directly. Include your project ID and as much information as possible.
          </p>
          <p className="flex items-center gap-x-1.5 flex-wrap">
            Email:{' '}
            <span className="inline-flex items-center gap-x-1">
              <a
                href={`mailto:support@supabase.com?subject=${encodeURIComponent('Support Request')}${hasProjectRef ? `${encodeURIComponent(' for Project ID: ')}${encodeURIComponent(projectRef)}` : ''}&body=${encodeURIComponent('Here is a detailed description of the problem I am experiencing and any other information that might be helpful...')}`}
                className="hover:text-foreground transition-colors duration-100"
              >
                <code className="text-code-inline !text-foreground-light underline decoration-foreground-lighter/50 hover:decoration-foreground-lighter/80 transition-colors duration-100">
                  support@supabase.com
                </code>
              </a>
              <CopyButton
                type="text"
                text="support@supabase.com"
                iconOnly
                onClick={() => toast.success('Copied email address to clipboard')}
              />
            </span>
          </p>
          {hasProjectRef && (
            <p className="flex items-center gap-x-1.5 flex-wrap">
              Project ID:{' '}
              <span className="inline-flex items-center gap-x-1">
                <code className="text-code-inline !text-foreground-light">{projectRef}</code>
                <CopyButton
                  iconOnly
                  type="text"
                  text={projectRef}
                  onClick={() => toast.success('Copied project ID to clipboard')}
                />
              </span>
            </p>
          )}
        </>
      }
    />
  )
}

interface SupportFromBodyProps {
  form: UseFormReturn<SupportFormValues>
  state: SupportFormState
  dispatch: Dispatch<SupportFormActions>
  initialError: string | null
  selectedProjectRef: string | null
}

function SupportFormBody({
  form,
  state,
  dispatch,
  initialError,
  selectedProjectRef,
}: SupportFromBodyProps) {
  const isSuccess = state.type === 'success'

  return (
    <div
      className={cn(
        'min-w-full w-full space-y-12 rounded border bg-panel-body-light shadow-md',
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
        <SupportFormV2 form={form} initialError={initialError} state={state} dispatch={dispatch} />
      )}
    </div>
  )
}

import * as Sentry from '@sentry/nextjs'
import { Loader2, Wrench } from 'lucide-react'
import Link from 'next/link'
import { type Dispatch, type PropsWithChildren, useCallback, useReducer } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import SVG from 'react-inlinesvg'
import { toast } from 'sonner'
// End of third-party imports

import CopyButton from 'components/ui/CopyButton'
import InformationBox from 'components/ui/InformationBox'
import { InlineLink, InlineLinkClassName } from 'components/ui/InlineLink'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { usePlatformStatusQuery } from 'data/platform/platform-status-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useStateTransition } from 'hooks/misc/useStateTransition'
import { BASE_PATH, DOCS_URL } from 'lib/constants'
import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { AIAssistantOption } from './AIAssistantOption'
import { DiscordCTACard } from './DiscordCTACard'
import { HighlightProjectRefProvider, useHighlightProjectRefContext } from './HighlightContext'
import { Success } from './Success'
import type { ExtendedSupportCategories } from './Support.constants'
import type { SupportFormValues } from './SupportForm.schema'
import {
  createInitialSupportFormState,
  type SupportFormActions,
  supportFormReducer,
  type SupportFormState,
} from './SupportForm.state'
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
  return (
    <HighlightProjectRefProvider>
      <SupportFormPageContent />
    </HighlightProjectRefProvider>
  )
}

function SupportFormPageContent() {
  const { data: organizations } = useOrganizationsQuery()
  const [state, dispatch] = useReducer(supportFormReducer, undefined, createInitialSupportFormState)

  const { form, initialError, projectRef, orgSlug } = useSupportForm(dispatch)
  const selectedOrg = organizations?.find((org) => org.slug === orgSlug)
  const isFreePlan = selectedOrg?.plan.id === 'free'

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

  return (
    <SupportFormWrapper>
      <SupportFormHeader />

      <div className="flex flex-col gap-y-4">
        <AIAssistantOption projectRef={projectRef} organizationSlug={orgSlug} />
        <DiscordCTACard organizationSlug={orgSlug} />
      </div>

      <SupportFormBody
        form={form}
        state={state}
        dispatch={dispatch}
        initialError={initialError}
        selectedProjectRef={projectRef}
      />
      <SupportFormDirectEmailInfo />
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
  const { data, isLoading, isError } = usePlatformStatusQuery()
  const isHealthy = data?.isHealthy

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
                ) : isHealthy ? (
                  <div className="h-2 w-2 bg-brand rounded-full" />
                ) : (
                  <div className="h-2 w-2 bg-yellow-900 rounded-full" />
                )
              }
            >
              <Link href="https://status.supabase.com/" target="_blank" rel="noreferrer">
                {isLoading
                  ? 'Checking status'
                  : isError
                    ? 'Failed to check status'
                    : isHealthy
                      ? 'All systems operational'
                      : 'Active incident ongoing'}
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="center">
            Check Supabase status page
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

function SupportFormDirectEmailInfo() {
  const { scrollToRef, setShouldHighlightRef: setHighlight } = useHighlightProjectRefContext()

  return (
    <InformationBox
      title="Having trouble submitting the form?"
      description={
        <div className="flex flex-col gap-y-4">
          <p className="flex items-center gap-x-1 ">
            Email us directly at{' '}
            <InlineLink href="mailto:support@supabase.com" className="font-mono">
              support@supabase.com
            </InlineLink>
            <CopyButton
              type="text"
              text="support@supabase.com"
              iconOnly
              onClick={() => toast.success('Copied to clipboard')}
            />
          </p>
          <p>
            Please, make sure to{' '}
            <button
              type="button"
              className={cn(InlineLinkClassName, 'cursor-pointer')}
              onClick={() => {
                scrollToRef()
                setHighlight(true)
              }}
            >
              include your project ID
            </button>{' '}
            and as much information as possible.
          </p>
        </div>
      }
      defaultVisibility={true}
      hideCollapse={true}
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
  const showSuccessMessage = state.type === 'success'

  return (
    <div
      className={cn(
        'min-w-full w-full space-y-12 rounded border bg-panel-body-light shadow-md',
        `${showSuccessMessage ? 'pt-8' : 'py-8'}`,
        'border-default'
      )}
    >
      {showSuccessMessage ? (
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

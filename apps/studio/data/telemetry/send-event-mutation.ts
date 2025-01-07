import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { components } from 'api-types'

import { isBrowser, LOCAL_STORAGE_KEYS } from 'common'
import { handleError, post } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import {
  ConnectionStringCopiedEvent,
  CronJobCreateClickedEvent,
  CronJobCreatedEvent,
  CronJobDeleteClickedEvent,
  CronJobDeletedEvent,
  CronJobHistoryClickedEvent,
  CronJobUpdateClickedEvent,
  CronJobUpdatedEvent,
  FeaturePreviewsClickedEvent,
  FeaturePreviewEnabledEvent,
  FeaturePreviewDisabledEvent,
  SqlEditorQuickstartClickedEvent,
  SqlEditorTemplateClickedEvent,
  SqlEditorResultDownloadCsvClickedEvent,
  SqlEditorResultCopyMarkdownClickedEvent,
  SqlEditorResultCopyJsonClickedEvent,
  SignUpEvent,
  SignInEvent,
  RealtimeInspectorListenChannelClickedEvent,
  RealtimeInspectorBroadcastSentEvent,
  RealtimeInspectorMessageClickedEvent,
  RealtimeInspectorCopyMessageClickedEvent,
  RealtimeInspectorFiltersAppliedEvent,
  RealtimeInspectorDatabaseRoleUpdatedEvent,
  AssistantPromptSubmittedEvent,
  AssistantDebugSubmittedEvent,
  AssistantSuggestionRunQueryClickedEvent,
  AssistantSqlDiffHandlerEvaluatedEvent,
  AssistantEditInSqlEditorClickedEvent,
} from 'lib/constants/telemetry'
import { useRouter } from 'next/router'
import type { ResponseError } from 'types'

export type SendEventVariables =
  | SignUpEvent
  | SignInEvent
  | ConnectionStringCopiedEvent
  | CronJobCreatedEvent
  | CronJobUpdatedEvent
  | CronJobDeletedEvent
  | CronJobCreateClickedEvent
  | CronJobUpdateClickedEvent
  | CronJobDeleteClickedEvent
  | CronJobHistoryClickedEvent
  | FeaturePreviewsClickedEvent
  | FeaturePreviewEnabledEvent
  | FeaturePreviewDisabledEvent
  | RealtimeInspectorListenChannelClickedEvent
  | RealtimeInspectorBroadcastSentEvent
  | RealtimeInspectorMessageClickedEvent
  | RealtimeInspectorCopyMessageClickedEvent
  | RealtimeInspectorFiltersAppliedEvent
  | RealtimeInspectorDatabaseRoleUpdatedEvent
  | SqlEditorQuickstartClickedEvent
  | SqlEditorTemplateClickedEvent
  | SqlEditorResultDownloadCsvClickedEvent
  | SqlEditorResultCopyMarkdownClickedEvent
  | SqlEditorResultCopyJsonClickedEvent
  | AssistantPromptSubmittedEvent
  | AssistantDebugSubmittedEvent
  | AssistantSuggestionRunQueryClickedEvent
  | AssistantSqlDiffHandlerEvaluatedEvent
  | AssistantEditInSqlEditorClickedEvent

type SendEventPayload = components['schemas']['TelemetryEventBodyV2']

export async function sendEvent({ body }: { body: SendEventPayload }) {
  const consent =
    (typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null) === 'true'

  if (!consent || !IS_PLATFORM) return undefined

  const headers = { Version: '2' }
  const { data, error } = await post(`/platform/telemetry/event`, { body, headers })

  if (error) handleError(error)
  return data
}

type SendEventData = Awaited<ReturnType<typeof sendEvent>>

export const useSendEventMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<SendEventData, ResponseError, SendEventVariables>,
  'mutationFn'
> = {}) => {
  const router = useRouter()

  const title = typeof document !== 'undefined' ? document?.title : ''
  const referrer = typeof document !== 'undefined' ? document?.referrer : ''

  return useMutation<SendEventData, ResponseError, SendEventVariables>(
    (vars) => {
      const { action } = vars
      const properties = 'properties' in vars ? vars.properties : {}

      const body: SendEventPayload = {
        action,
        page_url: window.location.href,
        page_title: title,
        pathname: router.pathname,
        ph: {
          referrer,
          language: router?.locale ?? 'en-US',
          user_agent: navigator.userAgent,
          search: window.location.search,
          viewport_height: isBrowser ? window.innerHeight : 0,
          viewport_width: isBrowser ? window.innerWidth : 0,
        },
        custom_properties: properties as any,
      }

      return sendEvent({ body })
    },
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          console.error(`Failed to send Telemetry event: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}

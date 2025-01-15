import { components } from 'api-types'
import { createMutation } from 'react-query-kit'

import { isBrowser, LOCAL_STORAGE_KEYS } from 'common'
import { handleError, post } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import {
  AssistantDebugSubmittedEvent,
  AssistantEditInSqlEditorClickedEvent,
  AssistantPromptSubmittedEvent,
  AssistantSqlDiffHandlerEvaluatedEvent,
  AssistantSuggestionRunQueryClickedEvent,
  ConnectionStringCopiedEvent,
  CronJobCreateClickedEvent,
  CronJobCreatedEvent,
  CronJobDeleteClickedEvent,
  CronJobDeletedEvent,
  CronJobHistoryClickedEvent,
  CronJobUpdateClickedEvent,
  CronJobUpdatedEvent,
  FeaturePreviewDisabledEvent,
  FeaturePreviewEnabledEvent,
  FeaturePreviewsClickedEvent,
  RealtimeInspectorBroadcastSentEvent,
  RealtimeInspectorCopyMessageClickedEvent,
  RealtimeInspectorDatabaseRoleUpdatedEvent,
  RealtimeInspectorFiltersAppliedEvent,
  RealtimeInspectorListenChannelClickedEvent,
  RealtimeInspectorMessageClickedEvent,
  SignInEvent,
  SignUpEvent,
  SqlEditorQuickstartClickedEvent,
  SqlEditorResultCopyJsonClickedEvent,
  SqlEditorResultCopyMarkdownClickedEvent,
  SqlEditorResultDownloadCsvClickedEvent,
  SqlEditorTemplateClickedEvent,
} from 'lib/constants/telemetry'
import type { ResponseError } from 'types'

export type SendEventVariables = (
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
) & { pathname: string }

type SendEventBody = components['schemas']['TelemetryEventBodyV2Dto']

export async function sendEvent(variables: SendEventVariables) {
  const consent =
    (typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null) === 'true'

  if (!consent || !IS_PLATFORM) return undefined

  const title = typeof document !== 'undefined' ? document?.title : ''
  const referrer = typeof document !== 'undefined' ? document?.referrer : ''

  const { action } = variables
  const properties = 'properties' in variables ? variables.properties : {}

  const body: SendEventBody = {
    action,
    page_url: window.location.href,
    page_title: title,
    pathname: variables.pathname ? variables.pathname : isBrowser ? window.location.pathname : '',
    ph: {
      referrer,
      language: navigator.language ?? 'en-US',
      user_agent: navigator.userAgent,
      search: window.location.search,
      viewport_height: isBrowser ? window.innerHeight : 0,
      viewport_width: isBrowser ? window.innerWidth : 0,
    },
    custom_properties: properties as any,
  }

  const headers = { Version: '2' }
  const { data, error } = await post(`/platform/telemetry/event`, { body, headers })

  if (error) handleError(error)
  return data
}

type SendEventData = Awaited<ReturnType<typeof sendEvent>>

export const useSendEventMutation = createMutation<
  SendEventData,
  SendEventVariables,
  ResponseError
>({
  mutationFn: sendEvent,
  onError(data) {
    console.error(`Failed to send Telemetry event: ${data.message}`)
  },
})

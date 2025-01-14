// Standardization as per document: https://www.notion.so/supabase/Event-tracking-standardization-1195004b775f80f98ee3fa9e70cf4d05

export enum TelemetryActions {
  SIGN_UP = 'sign_up',
  SIGN_IN = 'sign_in',

  ASSISTANT_PROMPT_SUBMITTED = 'assistant_prompt_submitted',
  ASSISTANT_DEBUG_SUBMITTED = 'assistant_debug_submitted',
  ASSISTANT_SUGGESTION_RUN_QUERY_CLICKED = 'assistant_suggestion_run_query_clicked',
  ASSISTANT_SQL_DIFF_HANDLER_EVALUATED = 'assistant_sql_diff_handler_evaluated',
  ASSISTANT_EDIT_IN_SQL_EDITOR_CLICKED = 'assistant_edit_in_sql_editor_clicked',

  CONNECTION_STRING_COPIED = 'connection_string_copied',

  CRON_JOB_CREATED = 'cron_job_created',
  CRON_JOB_UPDATED = 'cron_job_updated',
  CRON_JOB_DELETED = 'cron_job_deleted',
  CRON_JOB_DELETE_CLICKED = 'cron_job_delete_clicked',
  CRON_JOB_UPDATE_CLICKED = 'cron_job_update_clicked',
  CRON_JOB_CREATE_CLICKED = 'cron_job_create_clicked',
  CRON_JOB_HISTORY_CLICKED = 'cron_job_history_clicked',

  FEATURE_PREVIEWS_CLICKED = 'feature_previews_clicked',
  FEATURE_PREVIEW_ENABLED = 'feature_preview_enabled',
  FEATURE_PREVIEW_DISABLED = 'feature_preview_disabled',

  REALTIME_INSPECTOR_LISTEN_CHANNEL_CLICKED = 'realtime_inspector_listen_channel_clicked',
  REALTIME_INSPECTOR_BROADCAST_SENT = 'realtime_inspector_broadcast_sent',
  REALTIME_INSPECTOR_MESSAGE_CLICKED = 'realtime_inspector_message_clicked',
  REALTIME_INSPECTOR_COPY_MESSAGE_CLICKED = 'realtime_inspector_copy_message_clicked',
  REALTIME_INSPECTOR_FILTERS_APPLIED = 'realtime_inspector_filters_applied',
  REALTIME_INSPECTOR_DATABASE_ROLE_UPDATED = 'realtime_inspector_database_role_updated',

  SQL_EDITOR_QUICKSTART_CLICKED = 'sql_editor_quickstart_clicked',
  SQL_EDITOR_TEMPLATE_CLICKED = 'sql_editor_template_clicked',
  SQL_EDITOR_RESULT_DOWNLOAD_CSV_CLICKED = 'sql_editor_result_download_csv_clicked',
  SQL_EDITOR_RESULT_COPY_MARKDOWN_CLICKED = 'sql_editor_result_copy_markdown_clicked',
  SQL_EDITOR_RESULT_COPY_JSON_CLICKED = 'sql_editor_result_copy_markdown_clicked',
}

/**
 * Triggered when a user signs up. When signing up with Email and Password, this is only triggered once user confirms their email.
 *
 * @group Events
 * @source studio
 * @page /sign-up
 */
export interface SignUpEvent {
  action: TelemetryActions.SIGN_UP
  properties: {
    category: 'conversion'
  }
}

/**
 * Triggered when a user signs in with Github, Email and Password or SSO.
 *
 * Some unintuitive behavior:
 *   - If signing up with GitHub the SignInEvent gets triggered first before the SignUpEvent.
 *
 * @group Events
 * @source studio
 * @page /sign-in-mfa
 */
export interface SignInEvent {
  action: TelemetryActions.SIGN_IN
  properties: {
    category: 'account'
  }
}

/**
 * User copied the database connection string.
 *
 * @group Events
 * @source studio
 */
export interface ConnectionStringCopiedEvent {
  action: TelemetryActions.CONNECTION_STRING_COPIED
  properties: {
    /**
     * Method selected by user, e.g. URI, PSQL, SQLAlchemy, etc.
     */
    connectionType: string
    /**
     * Language of the code block if selected, e.g. bash, go
     */
    lang: string
    /**
     * Connection Method, e.g. direct, transaction_pooler, session_pooler
     */
    connectionMethod: 'direct' | 'transaction_pooler' | 'session_pooler'
  }
}

/**
 * Cron job created.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/integrations/cron/jobs?dialog-shown=true
 */
export interface CronJobCreatedEvent {
  action: TelemetryActions.CRON_JOB_CREATED
  properties: {
    /**
     * What the cron job executes, e.g. sql_function or sql_snippet
     */
    type: 'sql_function' | 'sql_snippet' | 'edge_function' | 'http_request'
    /**
     * Schedule of the cron job in the format of * * * * *
     */
    schedule: string
  }
}

/**
 * Cron job updated.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/integrations/cron/jobs?dialog-shown=true
 */
export interface CronJobUpdatedEvent {
  action: TelemetryActions.CRON_JOB_UPDATED
  properties: {
    /**
     * What the cron job executes, e.g. sql_function or sql_snippet
     */
    type: 'sql_function' | 'sql_snippet' | 'edge_function' | 'http_request'
    /**
     * Schedule of the cron job in the format of * * * * *
     */
    schedule: string
  }
}

/**
 * Cron job deleted.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/integrations/cron/jobs
 */
export interface CronJobDeletedEvent {
  action: TelemetryActions.CRON_JOB_DELETED
}

/**
 * Create job button clicked that opens the dialog.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/integrations/cron/jobs
 */
export interface CronJobCreateClickedEvent {
  action: TelemetryActions.CRON_JOB_CREATE_CLICKED
}

/**
 * Edit cron job button (hidden in the dropdown) clicked that opens the dialog.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/integrations/cron/jobs
 */
export interface CronJobUpdateClickedEvent {
  action: TelemetryActions.CRON_JOB_UPDATE_CLICKED
}

/**
 * Delete cron job button (hidden in the dropdown) clicked that opens the deletion confirmation modal.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/integrations/cron/jobs
 */
export interface CronJobDeleteClickedEvent {
  action: TelemetryActions.CRON_JOB_DELETE_CLICKED
}

/**
 * History button clicked to see previous runs of the cron job
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/integrations/cron/jobs
 */
export interface CronJobHistoryClickedEvent {
  action: TelemetryActions.CRON_JOB_HISTORY_CLICKED
}

/**
 * The FeaturePreviewModal was opened.
 *
 * The FeaturePreviewModal can be opened clicking at the profile icon at the bottom left corner of the project sidebar.
 *
 * @group Events
 * @source studio
 */
export interface FeaturePreviewsClickedEvent {
  action: TelemetryActions.FEATURE_PREVIEWS_CLICKED
}

/**
 * A feature preview was enabled by the user through the FeaturePreviewModal.
 *
 * The FeaturePreviewModal can be opened clicking at the profile icon at the bottom left corner of the project sidebar.
 *
 * @group Events
 * @source studio
 */
export interface FeaturePreviewEnabledEvent {
  action: TelemetryActions.FEATURE_PREVIEW_ENABLED
  properties: {
    /**
     * Feature key of the preview that was enabled. e.g. supabase-ui-api-side-panel
     */
    feature: string
  }
}

/**
 * A feature preview was disabled by the user through the FeaturePreviewModal.
 *
 * The FeaturePreviewModal can be opened clicking at the profile icon at the bottom left corner of the project sidebar.
 *
 * @group Events
 * @source studio
 */
export interface FeaturePreviewDisabledEvent {
  action: TelemetryActions.FEATURE_PREVIEW_DISABLED
  properties: {
    /**
     * Feature key of the preview that was disabled. e.g. supabase-ui-api-side-panel
     */
    feature: string
  }
}

/**
 * After selecting channel, either "Listening to channel" or "Start listening" button was clicked.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/realtime/inspector
 */
export interface RealtimeInspectorListenChannelClickedEvent {
  action: TelemetryActions.REALTIME_INSPECTOR_LISTEN_CHANNEL_CLICKED
}

/**
 * A broadcast message was sent from the SendMessageModal.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/realtime/inspector
 */
export interface RealtimeInspectorBroadcastSentEvent {
  action: TelemetryActions.REALTIME_INSPECTOR_BROADCAST_SENT
}

/**
 * A message was clicked in the RealtimeInspector, which opens a sidebar that shows the messsage details including metadata.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/realtime/inspector
 */
export interface RealtimeInspectorMessageClickedEvent {
  action: TelemetryActions.REALTIME_INSPECTOR_MESSAGE_CLICKED
}

/**
 * A message was copied from the RealtimeInspector.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/realtime/inspector
 */
export interface RealtimeInspectorCopyMessageClickedEvent {
  action: TelemetryActions.REALTIME_INSPECTOR_COPY_MESSAGE_CLICKED
}

/**
 * Filters were applied in the RealtimeInspector.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/realtime/inspector
 */
export interface RealtimeInspectorFiltersAppliedEvent {
  action: TelemetryActions.REALTIME_INSPECTOR_FILTERS_APPLIED
}

/**
 * Database role was updated in the RealtimeInspector.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/realtime/inspector
 */
export interface RealtimeInspectorDatabaseRoleUpdatedEvent {
  action: TelemetryActions.REALTIME_INSPECTOR_DATABASE_ROLE_UPDATED
}

/**
 * Quickstart card clicked in the SQL editor.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/sql
 */
export interface SqlEditorQuickstartClickedEvent {
  action: TelemetryActions.SQL_EDITOR_QUICKSTART_CLICKED
  properties: {
    /**
     * The title of the quickstart card clicked.
     */
    quickstartName: string
  }
}

/**
 * Template card clicked in the SQL editor.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/sql
 */
export interface SqlEditorTemplateClickedEvent {
  action: TelemetryActions.SQL_EDITOR_TEMPLATE_CLICKED
  properties: {
    /**
     * The name of the template card clicked.
     */
    templateName: string
  }
}

/**
 * Result download CSV button clicked in the SQL editor.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/sql
 */
export interface SqlEditorResultDownloadCsvClickedEvent {
  action: TelemetryActions.SQL_EDITOR_RESULT_DOWNLOAD_CSV_CLICKED
}

/**
 * Result copy markdown button clicked in the SQL editor.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/sql
 */
export interface SqlEditorResultCopyMarkdownClickedEvent {
  action: TelemetryActions.SQL_EDITOR_RESULT_COPY_MARKDOWN_CLICKED
}

/**
 * Result copy JSON button clicked in the SQL editor.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/sql
 */
export interface SqlEditorResultCopyJsonClickedEvent {
  action: TelemetryActions.SQL_EDITOR_RESULT_COPY_JSON_CLICKED
}

/**
 * User submitted a prompt to the assistant sidebar.
 *
 * @group Events
 * @source studio
 */
export interface AssistantPromptSubmittedEvent {
  action: TelemetryActions.ASSISTANT_PROMPT_SUBMITTED
}

/**
 * User submitted a debug request to the assistant sidebar or prompt submitted has Help me to debug.
 *
 * @group Events
 * @source studio
 */
export interface AssistantDebugSubmittedEvent {
  action: TelemetryActions.ASSISTANT_DEBUG_SUBMITTED
}

/**
 * User clicked the run query button in the suggestion provided in the assistant sidebar.
 *
 * @group Events
 * @source studio
 */
export interface AssistantSuggestionRunQueryClickedEvent {
  action: TelemetryActions.ASSISTANT_SUGGESTION_RUN_QUERY_CLICKED
  properties: {
    /**
     * The type of suggestion that was run by the user. Mutate or Select query types only.
     */
    queryType: string
    category?: string
  }
}

/**
 * User accepted or rejected changes in sql ai diff handler. They can accept change by clicking accept button or typing shortcut (CMD+Enter) or reject by clicking reject button or typing shortcut (Esc). Handler only appears after clicking any dropdown option in Edit in Sql Editor in suggestion provided by the assistant. The dropdown options only appear in any page with 'sql' in url.
 *
 * @group Events
 * @source studio
 * @page /dashboard/project/{ref}/sql
 */
export interface AssistantSqlDiffHandlerEvaluatedEvent {
  action: TelemetryActions.ASSISTANT_SQL_DIFF_HANDLER_EVALUATED
  properties: {
    /**
     * Whether the user accepted or rejected the changes.
     */
    handlerAccepted: boolean
  }
}

/**
 * User clicked Edit in SQL Editor button in the assistant sidebar when user is in any page that does not have 'sql' in url or is in a new snippet.
 *
 * @group Events
 * @source studio
 */
export interface AssistantEditInSqlEditorClickedEvent {
  action: TelemetryActions.ASSISTANT_EDIT_IN_SQL_EDITOR_CLICKED
  properties: {
    /**
     * Whether the user is in the SQL editor page or in a new snippet.
     */
    isInSQLEditor: boolean
    isInNewSnippet: boolean
  }
}

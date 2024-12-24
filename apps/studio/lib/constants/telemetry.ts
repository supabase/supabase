// Standardization as per document: https://www.notion.so/supabase/Event-tracking-standardization-1195004b775f80f98ee3fa9e70cf4d05

export enum TelemetryActions {
  SIGN_UP = 'sign_up',
  SIGN_IN = 'sign_in',

  ASSISTANT_PROMPT_SUBMITTED = 'assistant_prompt_submitted',
  ASSISTANT_DEBUG_SUBMITTED = 'assistant_debug_submitted',
  ASSISTANT_SUGGESTION_RAN = 'assistant_suggestion_ran',
  ASSISTANT_SUGGESTION_ACCEPTED = 'assistant_suggestion_accepted',
  ASSISTANT_SUGGESTION_REJECTED = 'assistant_suggestion_rejected',
  ASSISTANT_SUGGESTION_COPIED = 'assistant_suggestion_copied',
  ASSISTANT_EDIT_SQL_CLICKED = 'assistant_edit_sql_clicked',

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
    type: 'sql_function' | 'sql_snippet'
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
    type: 'sql_function' | 'sql_snippet'
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

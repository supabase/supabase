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
  CRON_JOBS_VIEW_PREVIOUS_RUNS_CLICKED = 'cron_job_view_previous_runs_clicked',

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

// [Joshen] Just adding these to start consolidating our telemetry configs
// may change depending on how we choose to standardize across all apps
// Events define the name of the event and it'll be used as the primary identification
export enum TELEMETRY_EVENTS {
  FEATURE_PREVIEWS = 'Dashboard UI Feature Previews',
  AI_ASSISTANT_V2 = 'AI Assistant V2',
  CONNECT_UI = 'Connect UI',
  CRON_JOBS = 'Cron Jobs',
}

// [Joshen] Values refer to the "action" of the "event"
// e.g prompt submitted (action) through the AI assistant (event)
// e.g enabled feature x (action) via the feature preview (event)
export enum TELEMETRY_VALUES {
  /**
   * Track whenever a prompt is submitted to the AI (excluding debug prompts)
   * @context AI Assistant V2
   * @purpose Indication of engagement with the feature, aid in prioritizing efforts into the assistant itself
   */
  PROMPT_SUBMITTED = 'prompt-submitted',
  /**
   * Track whenever a debug prompt is submitted to the AI
   * @context AI Assistant V2
   * @purpose TBD
   */
  DEBUG_SUBMITTED = 'debug-submitted',
  /**
   * Track running a SQL suggestion from AI Assistant
   * @context AI Assistant V2
   * @purpose Indication of usefulness of AI assistant response, aid in prioritizing tweak of Assistant prompts to adjust output quality
   * @details Broken down into "select" or "mutation", and for the latter further broken down to the type of query (e.g "functions" or "rls-policies", default to unknown otherwise)
   * */
  RAN_SQL_SUGGESTION = 'ran-sql-suggestion',
  /**
   * Track editing a SQL suggestion:
   * @context AI Assistant V2
   * @purpose Indication of interest for wanting to expand from a SQL suggestion, aid in deciding the priority for an inline editor
   * */
  EDIT_IN_SQL_EDITOR = 'edit-in-sql-editor',
  /**
   * Track events for cron jobs
   * @context Cron Jobs
   * @purpose TBD (Joshen just adding these here as we needed some telemetry, but ideally we think this properly through and come up with purposes)
   */
  CRON_JOB_CREATED = 'cron-job-created',
  CRON_JOB_UPDATED = 'cron-job-updated',
  CRON_JOB_DELETED = 'cron-job-deleted',
  CRON_JOB_DELETE_CLICKED = 'cron-job-delete-clicked',
  CRON_JOB_UPDATE_CLICKED = 'cron-job-update-clicked',
  CRON_JOB_CREATE_CLICKED = 'cron-job-create-clicked',
  CRON_JOBS_VIEW_PREVIOUS_RUNS = 'view-previous-runs-clicked',
  COPY_CONNECTION_STRING = 'copy-connection-string',
}

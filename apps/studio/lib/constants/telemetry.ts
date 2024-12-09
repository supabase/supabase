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

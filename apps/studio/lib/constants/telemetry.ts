// [Joshen] Just adding these to start consolidating our telemetry configs
// may change depending on how we choose to standardize across all apps
// Events define the name of the event and it'll be used as the primary identification
export enum TELEMETRY_EVENTS {
  FEATURE_PREVIEWS = 'Dashboard UI Feature Previews',
  AI_ASSISTANT_V2 = 'AI Assistant V2',
}

// [Joshen] Values refer to the "action" of the "event"
// e.g prompt submitted (action) through the AI assistant (event)
// e.g enabled feature x (action) via the feature preview (event)
export enum TELEMETRY_VALUES {
  // Following are related to AI Assistant V2
  PROMPT_SUBMITTED = 'prompt-submitted',
  /** Track running a mutation SQL suggestion from AI Assistant: Indication of usefulness of AI assistant response */
  RAN_SQL_SUGGESTION = 'ran-sql-suggestion',
  /** Track editing a SQL suggestion: Indicatation of interest for wanting to expand from a SQL suggestion */
  EDIT_IN_SQL_EDITOR = 'edit-in-sql-editor',
}

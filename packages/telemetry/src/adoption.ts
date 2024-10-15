/**
 * Accelerate Feature Adoption and Improve UX
 * @module Adoptation
 */

/**
 * A user succesfully signs in to the dashboard.
 * @group Events
 * @source client-side studio
 */
export type sign_in = never
/**
 * User enter and submitted a query in our AI assistant.
 * @group Events
 * @source client-side studio
 */

export interface ai_debugger_requested {
  /**
   * The type of the assisant.
   */
  assistantType: 'sql-editor-ai-assistant' | 'rls-ai-assistant'
}
export interface ai_suggestion_asked {
  /**
   * The type of the assisant.
   */
  assistantType: 'sql-editor-ai-assistant' | 'rls-ai-assistant'
}
/**
 * User accepted a suggestion from our AI assistant.
 * @group Events
 * @source client-side studio
 */
export interface ai_suggestion_accepted {
  /**
   * The type of the assisant.
   */
  assistantType: 'sql-editor-ai-assistant' | 'rls-ai-assistant'
  /**
   * The type of the label.
   * @optional
   */
  labelType?: 'debug_snippet' | 'edit_snippet'
}
/**
 * User copied a suggestion from our AI assistant.
 * @group Events
 * @source client-side studio
 */
export interface ai_suggestion_copied {
  /**
   * The type of the assisant.
   */
  assistantType: 'sql-editor-ai-assistant' | 'rls-ai-assistant'
}

export interface ai_suggestion_diffed {
  /**
   * The type of the assisant.
   */
  assistantType: 'sql-editor-ai-assistant' | 'rls-ai-assistant'
}

export interface ai_suggestion_discarded {
  /**
   * The type of the assisant.
   */
  assistantType: 'sql-editor-ai-assistant' | 'rls-ai-assistant'
}

/**
 * Insert code suggestion from our AI assistant.
 * @group Events
 * @source client-side studio
 */
export interface ai_suggestion_inserted {
  /**
   * The type of the assisant.
   */
  assistantType: 'sql-editor-ai-assistant' | 'rls-ai-assistant'
}
/**
 * User rejected a suggestion from our AI assistant.
 * @group Events
 * @source client-side studio
 */
export interface ai_suggestion_rejected {
  /**
   * The type of the assisant.
   */
  assistantType: 'sql-editor-ai-assistant' | 'rls-ai-assistant'
  /**
   * The type of the label.
   */
  labelType: 'debug_snippet' | 'edit_snippet'
}
/**
 * User replaced a suggestion from our AI assistant.
 * @group Events
 * @source client-side studio
 */
export interface ai_suggestion_replaced {
  /**
   * The type of the assisant.
   */
  assistantType: 'sql-editor-ai-assistant' | 'rls-ai-assistant'
}
/**
 * Voted Yes or No in docs feedback on Is this helpful?
 * @group Events
 * @source client-side docs
 */
export interface feedback_voted {
  /**
   * Is the docs considered helpful by the user.
   */
  isDocHelpful: boolean
}
/**
 * Clicked copy as JSON button in SQL editor in dashboard.
 * @group Events
 * @source client-side studio
 */
export type sql_copy_as_json_clicked = never
/**
 * Clicked copy as Markdown button in SQL editor in dashboard.
 * @group Events
 * @source client-side studio
 */
export type sql_copy_as_markdown_clicked = never
/**
 * Clicked download CSV button in SQL editor in dashboard.
 *
 * @group Events
 * @source client-side studio
 */
export type sql_download_csv_clicked = never
/**
 * Clicked on a SQL quickstart card in studio, title will be in label.
 *
 * @group Events
 * @source client-side studio
 */
export interface sql_quickstart_clicked {
  /**
   * The title of the quickstart card.
   */
  title: string
}
/**
 * Clicked on a SQL template card in studio, title will be in label.
 *
 * @group Events
 * @source client-side studio
 */
export interface sql_template_script_clicked {
  /**
   * The title of the template script.
   */
  title: string
}
/**
 * Clicked on a specific message in realtime inspector in dashboard.
 *
 * @group Events
 * @source client-side studio
 */
export type realtime_message_clicked = never

/**
 * Copied a message in realtime inspector in dashboard.
 * @group Events
 * @source client-side studio
 */
export type realtime_message_copied = never

/**
 * Select and started listening to a channel in realtime.
 * @group Events
 * @source client-side studio
 */
export type realtime_start_listening_to_channel_clicked = {
  /**
   * What type of action was taken to initiate listening.
   */
  type: 'header' | 'popover'
}

/**
 * Sent a broadcast message in realtime inspector in dashboard.
 * @group Events
 * @source client-side studio
 */
export type realtime_broadcast_message_sent = never

/**
 * Applied filters in realtime inspector in dashboard.
 * @group Events
 * @source client-side studio
 */
export type realtime_filters_applied = never

/**
 * Changed the role of a database in realtime inspector in dashboard.
 * @group Events
 * @source client-side studio
 */

export type realtime_database_role_changed = never

/**
 * Enabled a feature preview in the dashboard.
 * @group Events
 * @source client-side studio
 */
export interface ui_feature_previews_enabled {
  /**
   * The name of the feature.
   */
  featureName: string
}

/**
 * Disabled a feature preview in the dashboard.
 * @group Events
 * @source client-side studio
 */
export interface ui_feature_previews_disabled {
  /**
   * The name of the feature.
   */
  featureName: string
}

/**
 * Event that's used to combine all adoption events.
 * Hidden from the docs as it's only meant to be used for type-checking.
 * @hidden
 */
export type AdoptionEvents = {
  sign_in: sign_in
  ai_debugger_requested: ai_debugger_requested
  ai_suggestion_asked: ai_suggestion_asked
  ai_suggestion_accepted: ai_suggestion_accepted
  ai_suggestion_copied: ai_suggestion_copied
  ai_suggestion_diffed: ai_suggestion_diffed
  ai_suggestion_discarded: ai_suggestion_discarded
  ai_suggestion_inserted: ai_suggestion_inserted
  ai_suggestion_rejected: ai_suggestion_rejected
  ai_suggestion_replaced: ai_suggestion_replaced
  ui_feature_previews_enabled: ui_feature_previews_enabled
  ui_feature_previews_disabled: ui_feature_previews_disabled
  feedback_voted: feedback_voted
  sql_copy_as_json_clicked: sql_copy_as_json_clicked
  sql_copy_as_markdown_clicked: sql_copy_as_markdown_clicked
  sql_download_csv_clicked: sql_download_csv_clicked
  sql_quickstart_clicked: sql_quickstart_clicked
  sql_template_script_clicked: sql_template_script_clicked
  realtime_message_clicked: realtime_message_clicked
  realtime_message_copied: realtime_message_copied
  realtime_start_listening_to_channel_clicked: realtime_start_listening_to_channel_clicked
  realtime_broadcast_message_sent: realtime_broadcast_message_sent
  realtime_database_role_changed: realtime_database_role_changed
  realtime_filters_applied: realtime_filters_applied
}

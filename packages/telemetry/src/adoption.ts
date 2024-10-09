/**
 * Accelerate Feature Adoption and Improve UX
 * @module Adoptation
 */

/**
 * A user succesfully signs in to the dashboard.
 * @group Events
 * @source server-side
 */
export type sign_in = never
/**
 * A user succesfully logs out from the dashboard.
 * @group Events
 * @source server-side
 */
export type logged_out = never
/**
 * A table is created to the database.
 * @group Events
 * @source server-side
 */
export type database_table_created = never
/**
 * A function is created to the database.
 * @group Events
 * @source server-side
 */
export type database_function_created = never
/**
 * A trigger is created to the database.
 * @group Events
 * @source server-side
 */
export type database_trigger_created = never
/**
 * An extension is enabled to the database.
 * @group Events
 * @source server-side
 */
export interface database_extension_enabled {
  /**
   * The name of the extension.
   */
  extensionName: string
}
/**
 * An index is created to the database.
 * @group Events
 * @source server-side
 */
export type database_index_created = never
/**
 * The project's Postgres version is upgraded.
 * @group Events
 * @source server-side
 */
export type database_upgraded = never
/**
 * An authetication user is added.
 * @group Events
 * @source server-side
 */
export type authentication_user_added = never
/**
 * A storage bucket is created.
 * @group Events
 * @source server-side
 */
export type storage_bucket_created = never
/**
 * An edge function is created.
 * @group Events
 * @source server-side
 */
export type edge_function_created = never
/**
 * User enter and submitted a query in our AI assistant.
 * @group Events
 * @source client-side studio
 */
export interface ai_suggestion_asked {
  /**
   * The type of the assisant.
   */
  assistantType: string
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
  assistantType: string
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
  assistantType: string
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
  assistantType: string
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
  assistantType: string
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
  assistantType: string
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
  /**
   * Which docs was rated.
   */
  docTitle: string
}
/**
 * The user has submitted feedback.
 * @group Events
 * @source client-side studio
 */
export type feedback_sent = never
/**
 * Select and started listening to a channel in realtime from the choose channel popup.
 * @group Events
 * @source client-side studio
 */
export type start_listening_to_channel_clicked = never
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
 * A SQL query is entered and submitted.
 * @group Events
 * @source client-side studio
 */
export type sql_query_submitted = never
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
  label: string
}
/**
 * Clicked on a SQL template card in studio, title will be in label.
 *
 * @group Events
 * @source client-side studio
 */
export interface sql_template_script_clicked {
  /**
   * The title of the quickstart card.
   */
  label: string
}
/**
 * Clicked on a specific message in realtime inspector in dashboard.
 *
 * @group Events
 * @source client-side studio
 */
export type specific_message_clicked = never
/**
 * Invitation to join an organization is sent.
 *
 * @group Events
 * @source client-side studio
 */
export interface user_invitation_sent {
  /**
   * The role of the invited user.
   */
  invitedUserRole: 'owner' | 'administrator' | 'developer'
}

/**
 * Event that's used to combine all adoption events.
 * Hidden from the docs as it's only meant to be used for type-checking.
 * @hidden
 */
export type AdoptionEvents = {
  sign_in: sign_in
  logged_out: logged_out
  database_table_created: database_table_created
  database_function_created: database_function_created
  database_trigger_created: database_trigger_created
  database_extension_enabled: database_extension_enabled
  database_index_created: database_index_created
  database_upgraded: database_upgraded
  authentication_user_added: authentication_user_added
  storage_bucket_created: storage_bucket_created
  edge_function_created: edge_function_created
  ai_suggestion_asked: ai_suggestion_asked
  ai_suggestion_accepted: ai_suggestion_accepted
  ai_suggestion_copied: ai_suggestion_copied
  ai_suggestion_inserted: ai_suggestion_inserted
  ai_suggestion_rejected: ai_suggestion_rejected
  ai_suggestion_replaced: ai_suggestion_replaced
  feedback_voted: feedback_voted
  feedback_sent: feedback_sent
  start_listening_to_channel_clicked: start_listening_to_channel_clicked
  sql_copy_as_json_clicked: sql_copy_as_json_clicked
  sql_copy_as_markdown_clicked: sql_copy_as_markdown_clicked
  sql_download_csv_clicked: sql_download_csv_clicked
  sql_query_submitted: sql_query_submitted
  sql_quickstart_clicked: sql_quickstart_clicked
  sql_template_script_clicked: sql_template_script_clicked
  specific_message_clicked: specific_message_clicked
  user_invitation_sent: user_invitation_sent
}

/**
 * Improve User Onboarding and Activation Rate
 * @module Activation
 */
/**
 * New user signs up successfully.
 * @group Events
 * @source client-side studio
 */
export type sign_up = never

export type database_connection_string_copied = {
  /**
   * label of the connection string
   */
  label: string
}

/**
 * Event that's used to combine all activation events.
 * Hidden from the docs as it's only meant to be used for type-checking.
 * @hidden
 */
export type ActivationEvents = {
  sign_up: sign_up
  database_connection_string_copied: database_connection_string_copied
}

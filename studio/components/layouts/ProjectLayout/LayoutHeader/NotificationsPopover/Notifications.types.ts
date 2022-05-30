// These should go into shared-types repo i think, but chucking it here for now
// For discussion on Monday

export interface TierLimitExceededNotification {
  dimension: string // probably an enum
  tier_limit: number
  maximum_recent_value: number
  // When values are updated, instead of creating a new notification
  last_updated_at: string
  first_violated_at: string
}

export interface PostgreslInformationalNotification {
  type: string // probably an enum
  new_version: string // This is assuming that all notifications are about version updates
  extension_name: string
}

export interface PostgresqlBugfixNotification {}

export interface NotificationMeta {
  restart_required: boolean
  services_to_restart: string[] // I don't think we need this
}

/**
 * Other questions:
 * - how many notifications to fetch at once?
 * - how to mark as seen from UI
 */

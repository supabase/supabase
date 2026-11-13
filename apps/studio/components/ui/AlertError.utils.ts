import { isUserError, type StudioError, type StudioErrorTag } from '@/lib/errors/studio-errors'

export const EVENT_ID_LABEL = 'Event ID (before sampling)'

export const OFFLINE_MESSAGE =
  'You may be temporarily offline. Check your internet connection and try again.'
export const USER_FAULT_DESCRIPTION =
  'Please try again. If the issue persists, try refreshing your browser.'

/** Defaults for `AlertError` by error tag and fault. Props the caller passes still win. */
export type ErrorPresentation = {
  /** Replaces the error message, shown without the "Error:" prefix */
  message?: string
  /** Replaces the default instructions */
  description?: string
  showInstructions: boolean
  hideContactSupport: boolean
  /** Request ID, event ID and the "Copy details" button */
  showDetails: boolean
}

export function getErrorPresentation(error: StudioError): ErrorPresentation {
  if (error._tag === 'NetworkUnreachable' && error.reason === 'offline') {
    return {
      message: OFFLINE_MESSAGE,
      showInstructions: false,
      hideContactSupport: true,
      showDetails: false,
    }
  }
  // The user can fix these themselves, and they're never sent to Sentry, so support details
  // would only add noise
  if (isUserError(error)) {
    return {
      description: USER_FAULT_DESCRIPTION,
      showInstructions: true,
      hideContactSupport: true,
      showDetails: false,
    }
  }
  return { showInstructions: true, hideContactSupport: false, showDetails: true }
}

type DetailLine = [label: string, value: string | number | undefined]

// A Record (not a switch default) so a new tag fails typecheck until its copy is decided.
// Postgres messages can echo SQL and user data, so SQL errors copy only the fields derived from
// the SQLSTATE and the static query name.
const TAG_SPECIFIC_LINES: Record<StudioErrorTag, (error: StudioError) => DetailLine[]> = {
  RequestAborted: (error) => [['Message', error.message]],
  NetworkUnreachable: (error) => [['Message', error.message]],
  MalformedResponse: (error) => [['Message', error.message]],
  PlatformError: (error) => [['Message', error.message]],
  UnclassifiedApiError: (error) => [['Message', error.message]],
  DbConnectionTimeout: (error) => [['Message', error.message]],
  UnexpectedError: (error) => [['Message', error.message]],
  UserSqlError: (error) => [
    ['SQL state', error.sqlState],
    ['Position', error.position],
  ],
  StudioSqlError: (error) => [
    ['SQL state', error.sqlState],
    ['Position', error.position],
    ['Query name', error.queryName],
  ],
}

/**
 * Plain-text details a user can paste into a support request. Never includes `formattedError`, `metadata`,
 * `cause`, or SQL.
 */
export function formatErrorDetails(
  error: StudioError,
  { subject, now }: { subject?: string; now: Date }
): string {
  const lines: DetailLine[] = [
    ['Subject', subject],
    ['Error', error._tag],
    ['Fault', error.fault],
    ['Reason', error.reason],
    ['HTTP status', error.code],
    ...TAG_SPECIFIC_LINES[error._tag](error),
    ['Method', error.method],
    ['Endpoint', error.endpoint],
    ['Request ID', error.requestId],
    [EVENT_ID_LABEL, error.errorEventId],
    ['Copied at', now.toISOString()],
  ]

  return lines
    .filter((line): line is [string, string | number] => line[1] !== undefined && line[1] !== '')
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n')
}

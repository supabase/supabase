import * as Sentry from '@sentry/nextjs'
import { ResponseError } from 'types'

type CaptureMessageOptions = {
  context: string
  message: string
}

const WHITELIST_ERRORS = [
  // Common validation errors
  'email must be an email',
  'Password is known to be weak and easy to guess, please choose a different one',
  // Authentication errors
  'A user with this email already exists',
  'Password should contain at least one character of each',
  'You attempted to send email to an inactive recipient',
  'New password should be different from the old password',
  'Invalid TOTP code entered',
  'No SSO provider assigned for this domain',
  // Project creation errors
  'The following organization members have reached their maximum limits for the number of active free projects',
  'db_pass must be longer than or equal to 4 characters',
  'There are overdue invoices in the organization(s)',
  'name should not contain a . string',
  'Project creation in the Supabase dashboard is disabled for this Vercel-managed organization.',
  'Your account, which is handled by the Fly Supabase extension, cannot access this endpoint.',
  'already exists in your organization.',
]

/**
 * Captures a critical error to Sentry, filtering out whitelisted errors.
 *
 * @param error - The error object (ResponseError, Error, or any object with a message property)
 * @param context - The context/action that failed (e.g., 'reset password', 'sign up', 'create project')
 *   Attached as the `context` tag on the Sentry event.
 */
export function captureCriticalError(
  error: ResponseError | Error | { message: string },
  context: string
): void {
  if (!error.message) {
    return
  }

  if (error instanceof ResponseError) {
    handleResponseError(error, context)
    return
  }
  if (error instanceof Error) {
    handleError(error, context)
    return
  }

  handleUnknownError(error, context)
}

function handleResponseError(error: ResponseError, context: string) {
  const { code, message, requestPathname } = error
  if (!requestPathname || !code) {
    captureMessage({
      message: `Response Error (no code or requestPathname) w/ message: ${error.message}`,
      context,
    })
    return
  }

  if (code >= 500) {
    // Only capture 5XX errors as critical errors
    captureMessage({
      context,
      message: `requestPathname ${requestPathname} w/ message: ${message}`,
    })
    return
  }
}

function handleError(error: Error, context: string) {
  if (!error.message) {
    return
  }

  captureMessage({
    message: error.message,
    context,
  })
}

function handleUnknownError(error: unknown, context: string) {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    captureMessage({
      message: error.message,
      context,
    })
  }
}

function captureMessage({ message, context }: CaptureMessageOptions) {
  if (WHITELIST_ERRORS.some((whitelisted) => message.includes(whitelisted))) {
    return
  }
  // Use captureException (vs captureMessage) so these appear as exceptions in Sentry
  // and can have dedicated alert rules. Grouping is still by message since all
  // CriticalErrors share the same synthetic stack trace.
  Sentry.withScope((scope) => {
    scope.setTag('critical', 'true')
    scope.setTag('context', context)
    const error = new Error(message)
    error.name = `CriticalError`
    Sentry.captureException(error)
  })
}

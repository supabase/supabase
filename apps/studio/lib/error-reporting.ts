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
 * Captures a critical error message to Sentry, filtering out whitelisted errors.
 *
 * @param error - The error object (ResponseError, Error, or any object with a message property)
 * @param context - The context/action that failed (e.g., 'reset password', 'sign up', 'create project')
 *
 * @example
 * captureCriticalError(error, 'reset password')
 * // Captures: '[CRITICAL][reset password] Failed: <error.message>'
 *
 * @example
 * captureCriticalError(error, 'sign up')
 * // Captures: '[CRITICAL][sign up] Failed: <error.message>'
 */
export function captureCriticalError(
  error: ResponseError | Error | { message: string },
  context: string
): void {
  const errorMessage = error instanceof Error ? error.message : error.message
  if (!errorMessage) {
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
      message: `[CRITICAL][${context}] Failed w/ Response Error (no code or requestPathname): ${error.message}`,
      context,
    })
    return
  }

  if (code >= 500) {
    // Only capture 5XX errors as critical errors
    captureMessage({
      context,
      message: `[CRITICAL][${context}] Failed requestPathname: ${requestPathname}: ${message}`,
    })
    return
  }
}

function handleError(error: Error, context: string) {
  const errorMessage = error.message
  if (!errorMessage) {
    return
  }

  captureMessage({
    message: `[CRITICAL][${context}] Failed: ${errorMessage}`,
    context,
  })
}

function handleUnknownError(error: unknown, context: string) {
  const hasMessage =
    error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'

  if (hasMessage) {
    captureMessage({
      message: `[CRITICAL][${context}] Failed: ${error.message}`,
      context,
    })
  }
}

function captureMessage({ message, context }: CaptureMessageOptions) {
  if (WHITELIST_ERRORS.some((whitelisted) => message.includes(whitelisted))) {
    return
  }
  Sentry.captureMessage(`[CRITICAL][${context}] ${message}`)
}

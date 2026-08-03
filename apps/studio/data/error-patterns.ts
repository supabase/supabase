import { ConnectionTimeoutError, UnknownAPIResponseError } from '@/types/api-errors'
import type { ClassifiedError } from '@/types/api-errors'
import type { ResponseError } from '@/types/base'

type ErrorConstructor = new (
  ...args: ConstructorParameters<typeof ResponseError>
) => ClassifiedError

export interface ErrorPattern {
  pattern: RegExp
  ErrorClass: ErrorConstructor
}

/**
 * Maps each error class to its matching regex pattern.
 * Using a Map guarantees each class can only appear once — duplicates are
 * impossible by construction rather than only caught by tests.
 */
const ERROR_PATTERN_MAP = new Map<ErrorConstructor, RegExp>([
  [ConnectionTimeoutError, /CONNECTION\s+TERMINATED\s+DUE\s+TO\s+CONNECTION\s+TIMEOUT/i],
])

export const ERROR_PATTERNS: ErrorPattern[] = Array.from(ERROR_PATTERN_MAP.entries()).map(
  ([ErrorClass, pattern]) => ({ ErrorClass, pattern })
)

/**
 * Builds the error instance for an API error message, picking the subclass whose
 * pattern matches and falling back to `UnknownAPIResponseError`.
 *
 * Every entry point in the data layer goes through this so that an error carries
 * the same class regardless of which fetch helper produced it — `ErrorMatcher`
 * keys its troubleshooting steps off that class.
 */
export function createClassifiedError(
  ...args: ConstructorParameters<typeof ResponseError>
): ClassifiedError {
  const [message] = args
  const matched = message ? ERROR_PATTERNS.find(({ pattern }) => pattern.test(message)) : undefined
  const ErrorClass = matched?.ErrorClass ?? UnknownAPIResponseError

  return new ErrorClass(...args)
}

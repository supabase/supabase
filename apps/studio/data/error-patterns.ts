import { ConnectionTimeoutError } from '@/lib/errors/studio-errors'
import type { ClassifiedError, StudioErrorInput } from '@/lib/errors/studio-errors'

type ErrorConstructor = new (input: StudioErrorInput) => ClassifiedError

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

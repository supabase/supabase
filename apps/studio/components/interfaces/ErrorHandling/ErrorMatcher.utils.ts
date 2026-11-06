import { ERROR_MAPPINGS, type ErrorMapping } from './error-mappings'
import { isStudioError } from '@/lib/errors/studio-errors'

export function getMappingForError(error: unknown): ErrorMapping | null {
  if (!isStudioError(error)) return null
  for (const [ErrorClass, mapping] of ERROR_MAPPINGS) {
    if (error instanceof ErrorClass) return mapping
  }
  return null
}

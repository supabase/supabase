import { ERROR_MAPPINGS, type ErrorMapping } from './error-mappings'
import { StudioError } from '@/lib/errors/studio-errors'

export function getMappingForError(error: unknown): ErrorMapping | null {
  const isResponseError = error instanceof StudioError
  if (!isResponseError) return null
  for (const [ErrorClass, mapping] of ERROR_MAPPINGS) {
    if (error instanceof ErrorClass) return mapping
  }
  return null
}

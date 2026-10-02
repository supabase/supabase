import { isRenderableError, StorageBackendError } from './storage-error'

export function render(error: unknown) {
  if (isRenderableError(error)) {
    return error.render()
  }

  return StorageBackendError.fromError(error).render()
}

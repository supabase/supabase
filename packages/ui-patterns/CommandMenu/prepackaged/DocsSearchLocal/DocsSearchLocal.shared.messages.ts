export const MAIN_THREAD_MESSAGE = {
  INIT: 'INIT',
  SEARCH: 'SEARCH',
  ABORT_SEARCH: 'ABORT_SEARCH',
} as const

export const WORKER_MESSAGE = {
  CHECKPOINT: 'CHECKPOINT',
  ERROR: 'ERROR',
  SEARCH_ERROR: 'SEARCH_ERROR',
  NOT_READY: 'NOT_READY',
  SEARCH_RESULTS: 'SEARCH_RESULTS',
} as const

type ErrorLike = {
  message?: string
}

/**
 * Post a message to the main thread to signal that the worker has reached
 * a certain checkpoint.
 *
 * For example, can be used for status messages like an initializing phase
 * being finished.
 *
 * @param payload - Custom event data associated with the checkpoint
 */
export function checkpoint<Payload extends object>(port: MessagePort, payload: Payload) {
  port.postMessage({
    type: WORKER_MESSAGE.CHECKPOINT,
    payload,
  })
}

export function convertError(error: unknown): ErrorLike {
  return !!error && typeof error === 'object' ? error : { message: error }
}

/**
 * Pass an error on to the main thread.
 *
 * @param [maybeCustomPayload] - Custom data to associate with the error
 */
export function postError<Payload extends object>(
  port: MessagePort,
  error: ErrorLike,
  maybeCustomPayload?: Payload
) {
  const message = {
    type: WORKER_MESSAGE.SEARCH_ERROR,
    payload: { message: error.message },
  }
  if (maybeCustomPayload) {
    if ('message' in maybeCustomPayload) delete maybeCustomPayload.message
    Object.assign(message.payload, maybeCustomPayload)
  }
  self.postMessage(message)
}

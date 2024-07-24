export const MAIN_THREAD_MESSAGE = {
  INIT: 'INIT',
  SEARCH: 'SEARCH',
}

export const WORKER_MESSAGE = {
  CHECKPOINT: 'CHECKPOINT',
  ERROR: 'ERROR',
  SEARCH_RESULTS: 'SEARCH_RESULTS',
}

/**
 * @typedef {Object} ErrorLike
 * @property {string} message
 */

/**
 * Post a message to the main thread to signal that the worker has reached
 * a certain checkpoint.
 *
 * For example, can be used for status messages like an initializing phase
 * being finished.
 *
 * @param {{}} payload - Custom event data associated with the checkpoint
 */
export function checkpoint(payload) {
  self.postMessage({
    type: WORKER_MESSAGE.CHECKPOINT,
    payload,
  })
}

/**
 *
 * @param {ErrorLike} error - An ErrorLike minimally containing a message field
 * @param {{}} [maybeCustomPayload] - Custom data to associate with the error
 */
export function postError(error, maybeCustomPayload) {
  const message = {
    type: WORKER_MESSAGE.ERROR,
    payload: { message: error.message },
  }
  if (maybeCustomPayload) {
    delete maybeCustomPayload.message
    Object.assign(message.payload, maybeCustomPayload)
  }
  self.postMessage(message)
}

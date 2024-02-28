import assert from 'node:assert'

/**
 * Ensures heavy code doesn't get accidentally incorporated in the client by
 * running a function that is only available in Node.
 */
const assertServer = () => {
  assert('Running in Node')
}

export { assertServer }

import crossFetch from 'cross-fetch'
import timeoutPromise from './timeout.js'

export default async function fetch(
  input: RequestInfo,
  init?: RequestInit,
  timeout: number = 10000
): Promise<Response> {
  if (init?.method === 'POST' && timeout === 10000) {
    timeout = 15000
  }
  const controller = new AbortController()
  const initWithSignal = init
  if (!init?.signal) {
    const initWithSignal = {
      ...init,
      signal: controller.signal,
    }
  }
  return timeoutPromise(crossFetch(input, initWithSignal), timeout, controller)
}

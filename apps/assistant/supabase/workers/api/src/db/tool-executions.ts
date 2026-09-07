import { assistantSessionStore, withSessionStoreErrors } from './session-store'

export function executeOnce(input: Parameters<typeof assistantSessionStore.executeOnce>[0]) {
  return withSessionStoreErrors(() => assistantSessionStore.executeOnce(input))
}

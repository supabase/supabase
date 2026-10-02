/**
 * PubSub payloads cross a runtime boundary as `unknown`. Most subscribers expect a
 * cache-key string; use this guard to validate before treating the payload as one.
 */
export function isStringMessage(message: unknown): message is string {
  return typeof message === 'string'
}

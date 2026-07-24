/**
 * Thrown by an adapter when a capability is not supported by the current
 * backend (e.g. running arbitrary SQL against supalite). The UI feature-detects
 * via `adapter.features` and should not call unsupported methods, but adapters
 * throw this as a safety net.
 */
export class NotSupportedError extends Error {
  constructor(capability: string) {
    super(`"${capability}" is not supported by this platform adapter.`)
    this.name = 'NotSupportedError'
  }
}

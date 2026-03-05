import type { Event as SentryEvent, StackFrame } from '@sentry/nextjs'
import { describe, expect, it } from 'vitest'

import {
  isBrowserWalletExtensionError,
  isCancellationRejection,
  isChallengeExpiredError,
  isUserAbortedOperation,
} from './instrumentation-client'

describe('Sentry beforeSend filtering functions', () => {
  describe('isBrowserWalletExtensionError', () => {
    it('returns true for Gate.io wallet extension error (gt-window-provider.js)', () => {
      const event: SentryEvent = {
        exception: {
          values: [
            {
              type: 'TypeError',
              value: 'en.shouldSetTallyForCurrentProvider is not a function',
              stacktrace: {
                frames: [
                  { filename: 'app:///_next/static/chunks/main.js' } as StackFrame,
                  { filename: 'app:///gt-window-provider.js' } as StackFrame,
                ],
              },
            },
          ],
        },
      }

      expect(isBrowserWalletExtensionError(event)).toBe(true)
    })

    it('returns true for Gate.io BTC wallet extension error (gt-window-provider-btc.js)', () => {
      const event: SentryEvent = {
        exception: {
          values: [
            {
              type: 'TypeError',
              value: 'f.shouldSetTallyForCurrentProvider is not a function',
              stacktrace: {
                frames: [{ filename: 'app:///gt-window-provider-btc.js' } as StackFrame],
              },
            },
          ],
        },
      }

      expect(isBrowserWalletExtensionError(event)).toBe(true)
    })

    it('returns true for wallet-provider in abs_path', () => {
      const event: SentryEvent = {
        exception: {
          values: [
            {
              type: 'Error',
              value: 'wallet error',
              stacktrace: {
                frames: [
                  { abs_path: 'chrome-extension://abc123/wallet-provider.js' } as StackFrame,
                ],
              },
            },
          ],
        },
      }

      expect(isBrowserWalletExtensionError(event)).toBe(true)
    })

    it('returns false for regular application errors', () => {
      const event: SentryEvent = {
        exception: {
          values: [
            {
              type: 'Error',
              value: 'Regular error',
              stacktrace: {
                frames: [
                  { filename: 'app:///_next/static/chunks/main.js' } as StackFrame,
                  { filename: 'app:///_next/static/chunks/pages/index.js' } as StackFrame,
                ],
              },
            },
          ],
        },
      }

      expect(isBrowserWalletExtensionError(event)).toBe(false)
    })

    it('returns false for empty event', () => {
      const event: SentryEvent = {}
      expect(isBrowserWalletExtensionError(event)).toBe(false)
    })

    it('returns false when exception values are empty', () => {
      const event: SentryEvent = {
        exception: {
          values: [],
        },
      }
      expect(isBrowserWalletExtensionError(event)).toBe(false)
    })

    it('returns false when stacktrace frames are undefined', () => {
      const event: SentryEvent = {
        exception: {
          values: [
            {
              type: 'Error',
              value: 'Error without stacktrace',
            },
          ],
        },
      }
      expect(isBrowserWalletExtensionError(event)).toBe(false)
    })
  })

  describe('isUserAbortedOperation', () => {
    it('returns true for "operation was aborted" error', () => {
      const error = new Error('The operation was aborted.')
      const event: SentryEvent = {}

      expect(isUserAbortedOperation(error, event)).toBe(true)
    })

    it('returns true for "signal is aborted" error', () => {
      const error = new Error('signal is aborted without reason')
      const event: SentryEvent = {}

      expect(isUserAbortedOperation(error, event)).toBe(true)
    })

    it('returns true for "manually canceled" error', () => {
      const error = new Error('operation is manually canceled')
      const event: SentryEvent = {}

      expect(isUserAbortedOperation(error, event)).toBe(true)
    })

    it('returns true for "AbortError" message', () => {
      const error = new Error('AbortError: The operation was aborted')
      const event: SentryEvent = {}

      expect(isUserAbortedOperation(error, event)).toBe(true)
    })

    it('returns true when message is in event.message (no error object)', () => {
      const error = null
      const event: SentryEvent = {
        message: '[CRITICAL][sign in via EP] Failed: The operation was aborted.',
      }

      expect(isUserAbortedOperation(error, event)).toBe(true)
    })

    it('returns true for event message with "signal is aborted"', () => {
      const event: SentryEvent = {
        message: '[CRITICAL][sign in via EP] Failed: signal is aborted without reason',
      }

      expect(isUserAbortedOperation(undefined, event)).toBe(true)
    })

    it('returns false for regular errors', () => {
      const error = new Error('Something went wrong')
      const event: SentryEvent = {}

      expect(isUserAbortedOperation(error, event)).toBe(false)
    })

    it('returns false for empty inputs', () => {
      expect(isUserAbortedOperation(null, {})).toBe(false)
      expect(isUserAbortedOperation(undefined, {})).toBe(false)
    })

    it('handles non-Error objects gracefully', () => {
      const error = { message: 'The operation was aborted.' }
      const event: SentryEvent = {}

      // Non-Error objects should not match since we check instanceof Error
      expect(isUserAbortedOperation(error, event)).toBe(false)
    })
  })

  describe('isCancellationRejection', () => {
    it('returns true for cancellation type in extra.__serialized__', () => {
      const event: SentryEvent = {
        extra: {
          __serialized__: {
            msg: 'operation is manually canceled',
            type: 'cancelation',
          },
        },
      }

      expect(isCancellationRejection(event)).toBe(true)
    })

    it('returns false when type is not cancelation', () => {
      const event: SentryEvent = {
        extra: {
          __serialized__: {
            msg: 'some error',
            type: 'error',
          },
        },
      }

      expect(isCancellationRejection(event)).toBe(false)
    })

    it('returns false when __serialized__ is undefined', () => {
      const event: SentryEvent = {
        extra: {},
      }

      expect(isCancellationRejection(event)).toBe(false)
    })

    it('returns false when extra is undefined', () => {
      const event: SentryEvent = {}

      expect(isCancellationRejection(event)).toBe(false)
    })

    it('returns false when __serialized__ has no type property', () => {
      const event: SentryEvent = {
        extra: {
          __serialized__: {
            msg: 'some message',
          },
        },
      }

      expect(isCancellationRejection(event)).toBe(false)
    })
  })

  describe('isChallengeExpiredError', () => {
    it('returns true for challenge-expired error message', () => {
      const error = new Error('Non-Error promise rejection captured with value: challenge-expired')
      const event: SentryEvent = {}

      expect(isChallengeExpiredError(error, event)).toBe(true)
    })

    it('returns true when challenge-expired is in event.message', () => {
      const event: SentryEvent = {
        message: 'challenge-expired',
      }

      expect(isChallengeExpiredError(null, event)).toBe(true)
    })

    it('returns false for regular errors', () => {
      const error = new Error('Something went wrong')
      const event: SentryEvent = {}

      expect(isChallengeExpiredError(error, event)).toBe(false)
    })

    it('returns false for empty inputs', () => {
      expect(isChallengeExpiredError(null, {})).toBe(false)
      expect(isChallengeExpiredError(undefined, {})).toBe(false)
    })

    it('returns false for similar but different messages', () => {
      const error = new Error('challenge expired') // No hyphen
      const event: SentryEvent = {}

      expect(isChallengeExpiredError(error, event)).toBe(false)
    })
  })

  describe('integration scenarios', () => {
    it('correctly identifies SUPABASE-APP-353 pattern (cancellation rejection)', () => {
      // Based on actual Sentry issue SUPABASE-APP-353
      const event: SentryEvent = {
        exception: {
          values: [
            {
              type: 'UnhandledRejection',
              value: 'Object captured as promise rejection with keys: msg, type',
            },
          ],
        },
        extra: {
          __serialized__: {
            msg: 'operation is manually canceled',
            type: 'cancelation',
          },
        },
      }

      expect(isCancellationRejection(event)).toBe(true)
    })

    it('correctly identifies SUPABASE-APP-AFC pattern (wallet extension)', () => {
      // Based on actual Sentry issue SUPABASE-APP-AFC
      const event: SentryEvent = {
        exception: {
          values: [
            {
              type: 'TypeError',
              value: 'f.shouldSetTallyForCurrentProvider is not a function',
              stacktrace: {
                frames: [
                  {
                    filename:
                      'node_modules/.pnpm/@sentry+browser@10.27.0/node_modules/@sentry/browser/src/helpers.ts',
                    function: 'n',
                  } as StackFrame,
                  {
                    filename: 'app:///gt-window-provider-btc.js',
                    function: 'GateWindowProvider.internalListener',
                  } as StackFrame,
                ],
              },
            },
          ],
        },
      }

      expect(isBrowserWalletExtensionError(event)).toBe(true)
    })

    it('correctly identifies SUPABASE-APP-92A pattern (wallet extension)', () => {
      // Based on actual Sentry issue SUPABASE-APP-92A
      const event: SentryEvent = {
        exception: {
          values: [
            {
              type: 'TypeError',
              value: 'en.shouldSetTallyForCurrentProvider is not a function',
              stacktrace: {
                frames: [
                  {
                    filename:
                      'node_modules/.pnpm/@sentry+browser@10.27.0/node_modules/@sentry/browser/src/helpers.ts',
                    function: 'n',
                  } as StackFrame,
                  {
                    filename: 'app:///gt-window-provider.js',
                    function: 'GateWindowProvider.internalListener',
                  } as StackFrame,
                ],
              },
            },
          ],
        },
      }

      expect(isBrowserWalletExtensionError(event)).toBe(true)
    })

    it('correctly identifies SUPABASE-APP-BG6 pattern (user aborted)', () => {
      // Based on actual Sentry issue SUPABASE-APP-BG6
      const error = new Error('The operation was aborted.')
      const event: SentryEvent = {
        message: '[CRITICAL][sign in via EP] Failed: The operation was aborted.',
      }

      expect(isUserAbortedOperation(error, event)).toBe(true)
    })

    it('correctly identifies SUPABASE-APP-BG7 pattern (signal aborted)', () => {
      // Based on actual Sentry issue SUPABASE-APP-BG7
      const error = new Error('signal is aborted without reason')
      const event: SentryEvent = {
        message: '[CRITICAL][sign in via EP] Failed: signal is aborted without reason',
      }

      expect(isUserAbortedOperation(error, event)).toBe(true)
    })

    it('correctly identifies SUPABASE-APP-ACC pattern (challenge expired)', () => {
      // Based on actual Sentry issue SUPABASE-APP-ACC
      const error = new Error('Non-Error promise rejection captured with value: challenge-expired')
      const event: SentryEvent = {
        exception: {
          values: [
            {
              type: 'UnhandledRejection',
              value: 'Non-Error promise rejection captured with value: challenge-expired',
            },
          ],
        },
      }

      expect(isChallengeExpiredError(error, event)).toBe(true)
    })

    it('does not filter legitimate errors', () => {
      const error = new Error('Cannot read property "foo" of undefined')
      const event: SentryEvent = {
        exception: {
          values: [
            {
              type: 'TypeError',
              value: 'Cannot read property "foo" of undefined',
              stacktrace: {
                frames: [{ filename: 'app:///_next/static/chunks/pages/index.js' } as StackFrame],
              },
            },
          ],
        },
      }

      expect(isBrowserWalletExtensionError(event)).toBe(false)
      expect(isUserAbortedOperation(error, event)).toBe(false)
      expect(isCancellationRejection(event)).toBe(false)
      expect(isChallengeExpiredError(error, event)).toBe(false)
    })
  })
})

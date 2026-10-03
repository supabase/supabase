import { TENANTS_JWKS_UPDATE_CHANNEL } from '@internal/auth/jwks/constants'
import { PostgresPubSub } from '@internal/pubsub'

export function createConfigChangeAwaiter(
  pubSub: PostgresPubSub,
  channel: string,
  expectedCacheKey: string,
  timeoutMs: number
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      pubSub.subscriber.notifications.removeListener(channel, onNotification)
      reject(new Error(`Timed out after ${timeoutMs}ms waiting for ${channel}:${expectedCacheKey}`))
    }, timeoutMs)

    const onNotification = (cacheKey: string) => {
      if (cacheKey !== expectedCacheKey) {
        return
      }

      clearTimeout(timeout)
      pubSub.subscriber.notifications.removeListener(channel, onNotification)
      resolve(cacheKey)
    }

    pubSub.subscriber.notifications.on(channel, onNotification)
  })
}

// returns a promise that resolves the next time the jwk cache is invalidated
export function createJwkConfigChangeAwaiter(
  pubSub: PostgresPubSub,
  expectedCacheKey: string,
  timeoutMs: number
): Promise<string> {
  return createConfigChangeAwaiter(pubSub, TENANTS_JWKS_UPDATE_CHANNEL, expectedCacheKey, timeoutMs)
}

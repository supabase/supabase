import { CONFIG } from './config.js'
import retriedFetch from './retriedFetch.js'

export class PlatformClient {
  url: string
  #accessToken: string
  headers: Record<string, string>

  constructor({ url, accessToken }: { url: string; accessToken: string }) {
    this.url = url
    this.#accessToken = accessToken
    this.headers = {
      Authorization: `Bearer ${this.#accessToken}`,
      'content-type': 'application/json',
    }

    if (CONFIG.PLATFORM_THROTTLE_SKIP) {
      this.headers['user-agent'] =
        `node-fetch/1.0; integration-tests/v0.1; throttle_skipper_token=${CONFIG.PLATFORM_THROTTLE_SKIP};`
    }
  }

  send(
    endpoint: string,
    options?: Omit<RequestInit, 'body'> & { body?: Record<string, unknown> },
    timeout?: number,
    retries?: number,
    delayBase?: number
  ) {
    return retriedFetch(
      `${this.url}${endpoint}`,
      {
        ...(options ?? {}),
        body: options?.body ? JSON.stringify(options.body) : undefined,
        headers: { ...this.headers, ...(options?.headers ?? {}) },
      },
      timeout,
      retries,
      delayBase
    )
  }
}

export const platformClientV0 = new PlatformClient({
  url: CONFIG.SUPA_PLATFORM_URI,
  accessToken: CONFIG.SUPA_V0_KEY,
})

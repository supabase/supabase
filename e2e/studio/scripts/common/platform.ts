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

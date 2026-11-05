// Pacing for the sync's GitHub GraphQL mutations. GitHub rate-limits content
// creation, so createPacer() keeps a minimum gap between mutations and
// isRateLimitError() lets the scripts stop cleanly if the limit is hit anyway.
// Mutations are never retried: a retry after a timeout could create a second
// discussion (callers pass `request: { retries: 0 }` to disable the plugin's).

export const DEFAULT_MIN_INTERVAL_MS = 2000

const realSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** Resolves once `minIntervalMs` has passed since the previous call resolved. */
export function createPacer(
  minIntervalMs: number,
  {
    now = Date.now,
    sleep = realSleep,
  }: { now?: () => number; sleep?: (ms: number) => Promise<void> } = {}
): () => Promise<void> {
  let lastAt = Number.NEGATIVE_INFINITY
  return async () => {
    const wait = lastAt + minIntervalMs - now()
    if (wait > 0) await sleep(wait)
    lastAt = now()
  }
}

type GitHubErrorLike = {
  status?: number
  message?: string
  response?: { headers?: Record<string, string | number | undefined> } // RequestError
  headers?: Record<string, string | number | undefined> // GraphqlResponseError
  errors?: Array<{ type?: string }>
}

/** A GraphQL RATE_LIMITED error, any 429, or a 403 that signals rate limiting. */
export function isRateLimitError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const e = error as GitHubErrorLike

  if (e.errors?.some((err) => err.type === 'RATE_LIMITED')) return true
  if (e.status === 429) return true
  if (e.status !== 403) return false

  const headers = e.response?.headers ?? e.headers ?? {}
  return (
    /rate limit|abuse detection/i.test(e.message ?? '') ||
    Number.isFinite(Number(headers['retry-after'])) ||
    String(headers['x-ratelimit-remaining']) === '0'
  )
}

/** `--delay-ms=3000` overrides the minimum gap between mutations. */
export function readMinIntervalMs(argv: string[] = process.argv): number {
  const raw = argv.find((arg) => arg.startsWith('--delay-ms='))?.split('=')[1]
  const parsed = Number(raw)
  return raw !== undefined && Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : DEFAULT_MIN_INTERVAL_MS
}

const SWEEP_THRESHOLD = 10_000

export function createRateLimiter({ max, windowMs }: { max: number; windowMs: number }) {
  const requests = new Map<string, { count: number; resetAt: number }>()

  return function isRateLimited(req: Request): boolean {
    // Trusts the first x-forwarded-for hop: Vercel overwrites client-supplied
    // values, so this stops being spoof-proof if another proxy fronts the app.
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const now = Date.now()

    if (requests.size > SWEEP_THRESHOLD) {
      for (const [key, value] of requests) {
        if (now >= value.resetAt) requests.delete(key)
      }
    }

    const entry = requests.get(ip)

    if (!entry || now >= entry.resetAt) {
      requests.set(ip, { count: 1, resetAt: now + windowMs })
      return false
    }

    entry.count += 1
    return entry.count > max
  }
}

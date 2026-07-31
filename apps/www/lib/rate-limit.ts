export function createRateLimiter({ max, windowMs }: { max: number; windowMs: number }) {
  const requests = new Map<string, { count: number; resetAt: number }>()

  return function isRateLimited(req: Request): boolean {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const now = Date.now()
    const entry = requests.get(ip)

    if (!entry || now >= entry.resetAt) {
      requests.set(ip, { count: 1, resetAt: now + windowMs })
      return false
    }

    entry.count += 1
    return entry.count > max
  }
}

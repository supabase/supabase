import { HttpError } from '../http/errors'
import { adminQuery } from './postgres'

export async function checkRateLimit(key: string, limit: number) {
  const rows = await adminQuery<{ count: number }>(
    `
    insert into private.request_limits(key, window_start, count) values ($1, now(), 1)
    on conflict (key) do update set
      window_start = case when request_limits.window_start < now() - interval '5 minutes' then now() else request_limits.window_start end,
      count = case when request_limits.window_start < now() - interval '5 minutes' then 1 else request_limits.count + 1 end
    returning count`,
    [key]
  )
  if (rows[0].count > limit) {
    throw new HttpError(429, 'rate_limited', 'Too many requests. Try again in a few minutes.')
  }
}

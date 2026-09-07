import { z } from 'zod'

import { HttpError } from './errors'

export async function parseBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<z.output<T>> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new HttpError(400, 'invalid_request', 'Request body must be JSON.')
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success)
    throw new HttpError(400, 'invalid_request', 'Invalid request body.', {
      issues: parsed.error.issues,
    })
  return parsed.data
}

export function bearer(value: string | null) {
  const match = /^Bearer ([^\s]+)$/i.exec(value ?? '')
  if (!match) throw new HttpError(401, 'unauthorized', 'Sign in to continue.')
  return match[1]
}

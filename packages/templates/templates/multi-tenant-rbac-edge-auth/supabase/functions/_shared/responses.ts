export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

export const unauthorized = () => jsonError('unauthorized', 401)

export const forbidden = () => jsonError('forbidden', 403)

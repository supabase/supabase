import { alertIssueNotificationEventSchema, type DeliveryResult } from './event'
import type { NotificationReceiver } from './receivers'
import { verifyLogflareSignature } from './signature'

export type NotificationResult = { event_id: string; deliveries: DeliveryResult[] }

/**
 * Remembers recent results by event id, so a retried event isn't fanned out twice. It is
 * per server process and bounded, which is enough for a single self-hosted Studio.
 */
export function createSeenEvents(capacity: number) {
  const results = new Map<string, NotificationResult>()
  return {
    get: (eventId: string) => results.get(eventId),
    set(eventId: string, result: NotificationResult) {
      results.delete(eventId)
      results.set(eventId, result)
      if (results.size > capacity) {
        const oldest = results.keys().next().value
        if (oldest !== undefined) results.delete(oldest)
      }
    },
  }
}

export type SeenEvents = ReturnType<typeof createSeenEvents>

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

/**
 * The self-hosted control plane for alert issue notifications: verifies a signed Logflare event,
 * then fans it out to the receivers its policy names. On the platform a control-plane service
 * plays this role, so the route is not served there.
 */
export async function handleAlertIssueNotification(
  request: Request,
  {
    secret,
    receivers,
    now,
    seenEvents,
    isPlatform,
  }: {
    secret: string | undefined
    receivers: Record<string, NotificationReceiver>
    now: () => number
    seenEvents: SeenEvents
    isPlatform: boolean
  }
): Promise<Response> {
  if (isPlatform) return json(404, { error: { message: 'Not found' } })
  if (request.method !== 'POST') return json(405, { error: { message: 'Method not allowed' } })

  const rawBody = await request.text()
  const check = secret
    ? verifyLogflareSignature({
        secret,
        timestamp: request.headers.get('x-logflare-timestamp'),
        signature: request.headers.get('x-logflare-signature'),
        rawBody,
        now: now(),
      })
    : ({ ok: false, reason: 'missing_secret' } as const)
  if (!check.ok) return json(401, { error: { message: `Unauthorized: ${check.reason}` } })

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return json(422, { error: { message: 'Body is not valid JSON' } })
  }
  const parsed = alertIssueNotificationEventSchema.safeParse(payload)
  if (!parsed.success) return json(422, { error: { message: parsed.error.message } })
  const event = parsed.data

  const previous = seenEvents.get(event.event_id)
  if (previous) return json(202, previous)

  const deliveries = await Promise.all(
    event.policy.receivers.map(async (name): Promise<DeliveryResult> => {
      const receiver = receivers[name]
      if (!receiver) return { receiver: name, status: 'unknown_receiver' }
      return receiver.deliver(event)
    })
  )

  const result = { event_id: event.event_id, deliveries }
  seenEvents.set(event.event_id, result)
  return json(202, result)
}

import z from 'zod/v4'

import { assertSelfHosted } from '../util'
import type { AlertIssueNotificationEvent, DeliveryResult } from './event'
import { signStandardWebhook } from './signature'

/**
 * One place a notification can go. Webhooks are the only kind today; an email receiver or a
 * webhooks-service receiver implements the same `deliver`.
 */
export type NotificationReceiver = {
  name: string
  deliver: (event: AlertIssueNotificationEvent) => Promise<DeliveryResult>
}

const webhookReceiversSchema = z.record(
  z.string().min(1),
  z.object({ url: z.url(), secret: z.string().min(1) })
)

export type WebhookReceiverConfig = z.infer<typeof webhookReceiversSchema>[string]

/** Parses `ALERT_ISSUE_WEBHOOK_RECEIVERS`: a JSON object of receiver name to `{ url, secret }`. */
export function parseWebhookReceivers(raw: string | undefined) {
  if (!raw) return {}

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    throw new Error('ALERT_ISSUE_WEBHOOK_RECEIVERS is not valid JSON')
  }

  const parsed = webhookReceiversSchema.safeParse(json)
  if (!parsed.success) {
    throw new Error(`ALERT_ISSUE_WEBHOOK_RECEIVERS is invalid: ${z.prettifyError(parsed.error)}`)
  }
  return parsed.data
}

const MAX_ATTEMPTS = 3
const ATTEMPT_TIMEOUT_MS = 5_000
const BACKOFF_MS = [250, 1_000]

const isRetryable = (status: number) => status === 429 || status >= 500

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export function alertIssueUrl(studioUrl: string, event: AlertIssueNotificationEvent) {
  const { alert_issue: alertIssue } = event
  const project = alertIssue.identifiers.project ?? 'default'
  return `${studioUrl.replace(/\/$/, '')}/project/${encodeURIComponent(project)}/issues/alerts/${encodeURIComponent(alertIssue.alert_issue_id)}`
}

/** A webhook receiver that posts Standard Webhooks requests, retrying 429s, 5xxs and network errors. */
export function createWebhookReceiver(
  name: string,
  config: WebhookReceiverConfig,
  { studioUrl, sleep = wait }: { studioUrl: string; sleep?: (ms: number) => Promise<void> }
): NotificationReceiver {
  return {
    name,
    async deliver(event) {
      const id = `${event.event_id}:${name}`
      const body = JSON.stringify({
        type: event.type,
        occurred_at: event.occurred_at,
        data: {
          alert_issue: { ...event.alert_issue, url: alertIssueUrl(studioUrl, event) },
          policy: event.policy,
        },
      })

      let lastStatus: number | undefined
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const timestamp = Math.floor(Date.now() / 1000)
        try {
          const response = await fetch(config.url, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'webhook-id': id,
              'webhook-timestamp': String(timestamp),
              'webhook-signature': signStandardWebhook({
                id,
                timestamp,
                body,
                secret: config.secret,
              }),
            },
            body,
            signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
          })
          lastStatus = response.status
          if (response.ok) {
            return {
              receiver: name,
              status: 'delivered',
              http_status: response.status,
              attempts: attempt,
            }
          }
          if (!isRetryable(response.status)) {
            return {
              receiver: name,
              status: 'failed',
              http_status: response.status,
              attempts: attempt,
            }
          }
        } catch {
          lastStatus = undefined
        }
        if (attempt < MAX_ATTEMPTS) await sleep(BACKOFF_MS[attempt - 1])
      }

      return {
        receiver: name,
        status: 'failed',
        ...(lastStatus !== undefined && { http_status: lastStatus }),
        attempts: MAX_ATTEMPTS,
      }
    },
  }
}

let cachedConfig:
  | { raw: string | undefined; receivers: Record<string, WebhookReceiverConfig> }
  | undefined

/** The webhook receivers from `ALERT_ISSUE_WEBHOOK_RECEIVERS`, parsed once per value. */
export function configuredWebhookReceivers(
  studioUrl: string
): Record<string, NotificationReceiver> {
  assertSelfHosted()
  const raw = process.env.ALERT_ISSUE_WEBHOOK_RECEIVERS
  const config =
    cachedConfig && cachedConfig.raw === raw
      ? cachedConfig
      : { raw, receivers: parseWebhookReceivers(raw) }
  cachedConfig = config

  return Object.fromEntries(
    Object.entries(config.receivers).map(([name, config]) => [
      name,
      createWebhookReceiver(name, config, { studioUrl }),
    ])
  )
}

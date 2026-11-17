import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import { signStandardWebhook, verifyLogflareSignature } from './signature'

const SECRET = 'notifier-secret'
const NOW = 1_794_900_000

const sign = (timestamp: number, body: string, secret = SECRET) =>
  `v1=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`

describe('verifyLogflareSignature', () => {
  const body = '{"event_id":"e1"}'

  it('accepts a signature over the timestamp and raw body', () => {
    expect(
      verifyLogflareSignature({
        secret: SECRET,
        timestamp: String(NOW),
        signature: sign(NOW, body),
        rawBody: body,
        now: NOW,
      })
    ).toEqual({ ok: true })
  })

  it('rejects a signature made over a re-serialized body', () => {
    const reserialized = JSON.stringify(JSON.parse(' { "event_id" : "e1" } '))
    expect(
      verifyLogflareSignature({
        secret: SECRET,
        timestamp: String(NOW),
        signature: sign(NOW, ' { "event_id" : "e1" } '),
        rawBody: reserialized,
        now: NOW,
      })
    ).toEqual({ ok: false, reason: 'invalid_signature' })
  })

  it('rejects a wrong secret, a missing signature and a malformed one', () => {
    const base = { secret: SECRET, timestamp: String(NOW), rawBody: body, now: NOW }
    expect(verifyLogflareSignature({ ...base, signature: sign(NOW, body, 'other') })).toEqual({
      ok: false,
      reason: 'invalid_signature',
    })
    expect(verifyLogflareSignature({ ...base, signature: null })).toEqual({
      ok: false,
      reason: 'missing_signature',
    })
    expect(verifyLogflareSignature({ ...base, signature: 'v1=zz' })).toEqual({
      ok: false,
      reason: 'invalid_signature',
    })
  })

  it('rejects timestamps more than five minutes old or ahead', () => {
    const base = { secret: SECRET, rawBody: body, now: NOW }
    const old = NOW - 301
    expect(
      verifyLogflareSignature({ ...base, timestamp: String(old), signature: sign(old, body) })
    ).toEqual({ ok: false, reason: 'stale_timestamp' })
    const ahead = NOW + 301
    expect(
      verifyLogflareSignature({ ...base, timestamp: String(ahead), signature: sign(ahead, body) })
    ).toEqual({ ok: false, reason: 'stale_timestamp' })
    expect(verifyLogflareSignature({ ...base, timestamp: 'soon', signature: 'v1=00' })).toEqual({
      ok: false,
      reason: 'stale_timestamp',
    })
  })
})

describe('signStandardWebhook', () => {
  it('signs id.timestamp.body with the base64 key of a whsec_ secret', () => {
    const key = Buffer.from('a-32-byte-long-secret-for-tests!')
    const secret = `whsec_${key.toString('base64')}`
    const expected = createHmac('sha256', key).update('msg_1.1700000000.{"a":1}').digest('base64')

    expect(
      signStandardWebhook({ id: 'msg_1', timestamp: 1_700_000_000, body: '{"a":1}', secret })
    ).toBe(`v1,${expected}`)
  })

  it('uses the secret bytes as the key when it has no whsec_ prefix', () => {
    const expected = createHmac('sha256', 'plain-secret').update('m.1.{}').digest('base64')
    expect(signStandardWebhook({ id: 'm', timestamp: 1, body: '{}', secret: 'plain-secret' })).toBe(
      `v1,${expected}`
    )
  })
})

import assert from 'node:assert/strict'
import { afterEach, describe, it, mock } from 'node:test'

process.env.MANAGEMENT_API_TOKEN ??= 'test-token'
process.env.DATABASE_URL ??= 'postgres://localhost:5432/test'
process.env.VAULT_ENC_KEY ??= 'test-encryption-key'

const { deleteConfig, deleteEmailTemplate, pool, upsertConfig, upsertEmailTemplate, withTransaction } =
  await import('../src/store.js')

type Statement = { text: string; values: unknown[] | undefined }

function fakeClient(failOn?: (text: string) => boolean) {
  const statements: Statement[] = []
  let released = false
  const client = {
    query: async (text: string, values?: unknown[]) => {
      statements.push({ text, values })
      if (failOn?.(text)) throw new Error(`boom: ${text}`)
      return { rows: [] }
    },
    release: () => {
      released = true
    },
  }
  return { client, statements, isReleased: () => released }
}

afterEach(() => mock.restoreAll())

describe('withTransaction', () => {
  it('commits related writes on one connection', async () => {
    const { client, statements, isReleased } = fakeClient()
    mock.method(pool, 'connect', async () => client)

    await withTransaction(async (tx) => {
      await upsertEmailTemplate(
        { template_type: 'invite', source: '<p/>', source_format: 'html', rendered_html: '<p/>' },
        tx
      )
      await upsertConfig({ MAILER_TEMPLATES_INVITE_CONTENT: '<p/>', SMTP_PASS: 'x' }, tx)
    })

    const texts = statements.map((s) => s.text.trim().split(/\s+/)[0].toLowerCase())
    assert.deepEqual(texts, ['begin', 'insert', 'insert', 'insert', 'commit'])
    assert.ok(isReleased())
  })

  it('rolls back everything when a later statement fails', async () => {
    const { client, statements, isReleased } = fakeClient((text) =>
      text.includes('management.auth_config')
    )
    mock.method(pool, 'connect', async () => client)

    await assert.rejects(
      withTransaction(async (tx) => {
        await deleteEmailTemplate('invite', tx)
        await deleteConfig(['MAILER_TEMPLATES_INVITE_CONTENT'], tx)
      }),
      /boom/
    )

    const texts = statements.map((s) => s.text.trim().split(/\s+/)[0].toLowerCase())
    assert.deepEqual(texts, ['begin', 'delete', 'delete', 'rollback'])
    assert.ok(isReleased())
  })

  it('does not nest transactions when a client is passed to upsertConfig', async () => {
    const { client, statements } = fakeClient()
    const connect = mock.method(pool, 'connect', async () => client)

    await upsertConfig({ SITE_URL: 'http://a', DISABLE_SIGNUP: null }, client)

    assert.equal(connect.mock.callCount(), 0)
    const texts = statements.map((s) => s.text.trim().split(/\s+/)[0].toLowerCase())
    assert.deepEqual(texts, ['insert', 'delete'])
  })
})

describe('sensitive config serialization', () => {
  it('encrypts SMS_TEST_OTP before it reaches the database', async () => {
    const { client, statements } = fakeClient()
    const mapping = '+15555550100=123456,+15555550101=654321'

    await upsertConfig({ SMS_TEST_OTP: mapping, SITE_URL: 'http://a' }, client)

    const otpInsert = statements.find((s) => s.values?.[0] === 'SMS_TEST_OTP')
    assert.ok(otpInsert)
    const stored = String(otpInsert.values?.[1])
    assert.ok(!stored.includes('123456'))
    assert.ok(!stored.includes('+15555550100'))
    assert.match(stored, /^"enc:v2:/)

    const siteInsert = statements.find((s) => s.values?.[0] === 'SITE_URL')
    assert.equal(siteInsert?.values?.[1], JSON.stringify('http://a'))
  })
})

import assert from 'node:assert/strict'
import { test } from 'node:test'

process.env.DATABASE_URL ??= 'postgres://test'
process.env.MANAGEMENT_API_TOKEN ??= 'test-token'
process.env.VAULT_ENC_KEY ??= 'test-encryption-key'

const { defaultReactEmailSource, defaultEmailSubject } = await import(
  '../src/react-email-defaults.js'
)
const { renderReactEmail } = await import('../src/emails.js')

const EXPECTED_PLACEHOLDERS: Record<string, string[]> = {
  confirmation: ['{{ .ConfirmationURL }}'],
  invite: ['{{ .ConfirmationURL }}', '{{ .SiteURL }}'],
  magic_link: ['{{ .ConfirmationURL }}'],
  email_change: ['{{ .ConfirmationURL }}', '{{ .Email }}', '{{ .NewEmail }}'],
  recovery: ['{{ .ConfirmationURL }}'],
  reauthentication: ['{{ .Token }}'],
  password_changed_notification: ['{{ .Email }}'],
  email_changed_notification: ['{{ .OldEmail }}', '{{ .Email }}'],
  phone_changed_notification: ['{{ .Email }}', '{{ .OldPhone }}', '{{ .Phone }}'],
  identity_linked_notification: ['{{ .Provider }}', '{{ .Email }}'],
  identity_unlinked_notification: ['{{ .Provider }}', '{{ .Email }}'],
  mfa_factor_enrolled_notification: ['{{ .FactorType }}', '{{ .Email }}'],
  mfa_factor_unenrolled_notification: ['{{ .FactorType }}', '{{ .Email }}'],
}

test('every GoTrue template type has a react-email default with a subject', () => {
  for (const type of Object.keys(EXPECTED_PLACEHOLDERS)) {
    assert.ok(defaultReactEmailSource(type), `missing default source for ${type}`)
    assert.ok(defaultEmailSubject(type), `missing default subject for ${type}`)
  }
  assert.equal(defaultReactEmailSource('unknown_type'), null)
})

for (const [type, placeholders] of Object.entries(EXPECTED_PLACEHOLDERS)) {
  test(`default ${type} template renders with GoTrue placeholders intact`, async () => {
    const source = defaultReactEmailSource(type)
    assert.ok(source)
    const html = await renderReactEmail(source)
    assert.ok(html.startsWith('<!DOCTYPE'))
    for (const placeholder of placeholders) {
      assert.ok(html.includes(placeholder), `${type} is missing ${placeholder}`)
    }
  })
}

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

process.env.DATABASE_URL ??= 'postgres://test'
process.env.MANAGEMENT_API_TOKEN ??= 'test-token'
process.env.VAULT_ENC_KEY ??= 'test-encryption-key'

const { renderReactEmail } = await import('../src/emails.js')

test('renders the example react-email template preserving GoTrue tokens', async () => {
  const source = await readFile(new URL('../emails/confirmation-example.tsx', import.meta.url), 'utf8')
  const html = await renderReactEmail(source)
  assert.ok(html.includes('{{ .ConfirmationURL }}'))
  assert.ok(html.startsWith('<!DOCTYPE'))
})

test('rejects source without a component default export', async () => {
  await assert.rejects(() => renderReactEmail('export default 42'))
})

test('denies access to Node modules outside the react-email allowlist', async () => {
  const source = `
    const cp = require('node:child_process')
    export default function Email() { return null }
  `
  await assert.rejects(() => renderReactEmail(source), /not available to email templates/)
})

test('rejects source that fails to compile', async () => {
  await assert.rejects(() => renderReactEmail('const = broken syntax'))
})

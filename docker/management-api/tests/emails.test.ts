import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

process.env.DATABASE_URL ??= 'postgres://test'
process.env.MANAGEMENT_API_TOKEN ??= 'test-token'
process.env.VAULT_ENC_KEY ??= 'test-encryption-key'

const { RenderQueueFullError, renderReactEmail } = await import('../src/emails.js')

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

async function probe(expression: string): Promise<string> {
  const source = `
    import * as React from 'react'
    let result
    try { result = String((() => (${expression}))()) } catch (err) { result = 'blocked: ' + err.constructor.name + ': ' + err.message }
    export default function Email() { return React.createElement('p', null, 'probe=' + result) }
  `
  const html = await renderReactEmail(source)
  const match = html.match(/probe=([^<]*)</)
  assert.ok(match, html)
  return match[1]
}

test('template code has no process or network globals', async () => {
  const result = await probe("typeof process + ',' + typeof fetch + ',' + typeof globalThis.process")
  assert.equal(result, 'undefined,undefined,undefined')
})

test('blocks vm escape via the host Function constructor', async () => {
  const result = await probe("module.constructor.constructor('return process')().pid")
  assert.match(result, /^blocked: EvalError/)
})

test('blocks vm escape via a host function prototype chain', async () => {
  const result = await probe("console.log.constructor('return process')().version")
  assert.match(result, /^blocked: EvalError/)
})

test('blocks outbound sockets even from host stream classes', async () => {
  const result = await probe(
    "(() => { const Socket = console._stdout && console._stdout.constructor; if (!Socket) return 'no-socket'; new Socket().connect(80, '127.0.0.1'); return 'connected' })()"
  )
  assert.ok(result === 'no-socket' || /^blocked: Error: network access/.test(result), result)
})

test('denies filesystem, child process and network to template code', async () => {
  const source = `
    import * as React from 'react'
    const results = []
    for (const specifier of ['node:fs', 'node:child_process', 'node:net', 'fs', 'http', 'node:worker_threads']) {
      try { require(specifier); results.push(specifier + '=loaded') } catch (err) { results.push(specifier + '=blocked') }
    }
    export default function Email() { return React.createElement('p', null, results.join(',')) }
  `
  const html = await renderReactEmail(source)
  assert.ok(!html.includes('=loaded'), html)
})

test('renders without any inherited environment', async () => {
  const html = await renderReactEmail(`
    import * as React from 'react'
    export default function Email() { return React.createElement('p', null, 'ok') }
  `)
  assert.ok(html.includes('ok'))
})

test('stops templates that flood the renderer log', async () => {
  const source = `
    import * as React from 'react'
    const line = 'x'.repeat(65536)
    for (let i = 0; i < 1000; i++) console.log(line)
    export default function Email() { return React.createElement('p', null, 'ok') }
  `
  await assert.rejects(() => renderReactEmail(source), /too much output|renderer failed/)
})

test('stops templates that exhaust renderer memory', async () => {
  const source = `
    import * as React from 'react'
    const chunks = []
    for (let i = 0; i < 100000; i++) chunks.push('m'.repeat(1024 * 1024).split(''))
    export default function Email() { return React.createElement('p', null, String(chunks.length)) }
  `
  await assert.rejects(() => renderReactEmail(source))
})

test('serializes concurrent renders', async () => {
  const source = (label: string) => `
    import * as React from 'react'
    export default function Email() { return React.createElement('p', null, '${label}') }
  `
  const [a, b] = await Promise.all([renderReactEmail(source('first')), renderReactEmail(source('second'))])
  assert.ok(a.includes('first') && b.includes('second'))
})

test('rejects renders beyond the pending limit without queueing them', async () => {
  const source = `
    import * as React from 'react'
    export default function Email() { return React.createElement('p', null, 'queued') }
  `
  const admitted = Array.from({ length: 4 }, () => renderReactEmail(source))
  await assert.rejects(() => renderReactEmail(source), RenderQueueFullError)
  const results = await Promise.all(admitted)
  assert.ok(results.every((html) => html.includes('queued')))
  assert.ok((await renderReactEmail(source)).includes('queued'))
})

test('rejects oversized sources before they enter the queue', async () => {
  const source = `export default () => null; // ${'x'.repeat(512 * 1024)}`
  await assert.rejects(() => renderReactEmail(source), /too large/)
})

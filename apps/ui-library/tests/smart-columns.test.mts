// Copied beside the installed function by scripts/test-smart-columns.mts.
import assert from 'node:assert/strict'

import { model, tables } from './config.ts'
import { isAuthorized } from './index.ts'
import {
  decodeAnswers,
  fingerprint,
  questionsFor,
  validateTables,
  type SmartTable,
} from './schema.ts'
import { evaluateWithJev } from './worker.ts'

const [feedback] = tables
const { columns } = feedback

function response() {
  return {
    model: 'jev-1.13.0',
    answers: {
      category: {
        type: 'choice',
        choice: 'bug',
        confidence: 0.9,
        probabilities: { bug: 0.9, feature: 0.05, praise: 0, other: 0.05 },
      },
      needs_response: { type: 'noul', noul: 0.95 },
      severity: {
        type: 'score',
        score: 1.2,
        confidence: 0.8,
        probabilities: { '0': 0, '1': 0.8, '2': 0.2 },
      },
    },
  }
}

Deno.test('the example config is valid and builds Jev questions', () => {
  validateTables(tables)
  const questions = questionsFor(columns) as Record<string, Record<string, unknown>>
  assert.deepEqual(Object.keys(questions.needs_response), ['type', 'instructions'])
  assert.equal(questions.category.type, 'choice')
  assert.deepEqual(
    questions.category.criteria,
    (columns.category as { criteria: unknown }).criteria
  )
  assert.equal(questions.severity.type, 'score')
})

Deno.test('rejects invalid tables before asking Jev', () => {
  const invalid: SmartTable[] = [
    { ...feedback, inputs: ['category'] },
    { ...feedback, inputs: [] },
    { ...feedback, columns: { flag: { type: 'noul', instructions: 'Help?', falseBelow: 0.9 } } },
    {
      ...feedback,
      columns: { level: { type: 'score', instructions: 'How bad?', criteria: ['Only'] } },
    },
  ]
  for (const table of invalid) assert.throws(() => validateTables([table]))
  assert.throws(() => validateTables([feedback, feedback]))
})

Deno.test('fingerprints change with inputs, instructions, and the model only', async () => {
  const input = { title: 'Help', body: 'Export is broken' }
  const original = await fingerprint(model, input, columns.category)
  assert.equal(await fingerprint(model, { ...input }, columns.category), original)
  assert.notEqual(await fingerprint(model, { ...input, body: 'Fixed' }, columns.category), original)
  assert.notEqual(await fingerprint('jev-2', input, columns.category), original)
  assert.notEqual(
    await fingerprint(model, input, { ...columns.category, instructions: 'Which kind?' }),
    original
  )
})

Deno.test('decodes typed outputs and keeps answer details', () => {
  const { outputs, details } = decodeAnswers(columns, response())
  assert.deepEqual({ ...outputs }, { category: 'bug', needs_response: true, severity: 1.2 })
  assert.deepEqual(details.needs_response, { output: true, probability: 0.95 })
})

Deno.test('stores NULL below thresholds and handles boolean boundaries', () => {
  const uncertain = response()
  uncertain.answers.category.confidence = 0.4
  uncertain.answers.needs_response.noul = 0.5
  uncertain.answers.severity.confidence = 0.6
  const { outputs, details } = decodeAnswers(columns, uncertain)
  assert.deepEqual({ ...outputs }, { category: null, needs_response: null, severity: null })
  assert('value' in details.category)
  assert.equal(details.category.value, 'bug')
  uncertain.answers.needs_response.noul = 0.2
  assert.equal(decodeAnswers(columns, uncertain).outputs.needs_response, false)
  uncertain.answers.needs_response.noul = 0.8
  assert.equal(decodeAnswers(columns, uncertain).outputs.needs_response, true)
})

Deno.test('rejects malformed answers before writing any output', () => {
  for (const mutate of [
    (r: ReturnType<typeof response>) => {
      r.answers.category.choice = "bug'); drop table feedback; --"
    },
    (r: ReturnType<typeof response>) => {
      r.answers.category.probabilities.bug = 4
    },
    (r: ReturnType<typeof response>) => {
      r.answers.category.confidence = NaN
    },
    (r: ReturnType<typeof response>) => {
      r.answers.needs_response.noul = -1
    },
    (r: ReturnType<typeof response>) => {
      r.answers.severity.score = 3
    },
    (r: ReturnType<typeof response>) => {
      r.answers.severity.score = Infinity
    },
  ]) {
    const r = response()
    mutate(r)
    assert.throws(() => decodeAnswers(columns, r))
  }
  assert.throws(() => decodeAnswers(columns, { model: 'jev-1.13.0', answers: {} }))
})

Deno.test('requires the worker secret, without accepting a Supabase user token', async () => {
  const secret = '1234567890abcdef'.repeat(4)
  const req = (token: string) =>
    new Request('http://worker.test', { headers: { Authorization: `Bearer ${token}` } })
  assert.equal(await isAuthorized(req(secret), secret), true)
  assert.equal(await isAuthorized(req('user-jwt'), secret), false)
  assert.equal(await isAuthorized(req(secret + 'x'), secret), false)
  assert.equal(await isAuthorized(req(''), ''), false)
})

Deno.test('sends one Jev request, retries rate limits, and hides provider errors', async () => {
  const original = globalThis.fetch
  const request = {
    model,
    state: { title: 'Help', body: 'Export is broken' },
    questions: questionsFor(columns),
  }
  try {
    const statuses = [429, 200]
    let count = 0
    globalThis.fetch = async (url, init) => {
      count++
      assert.equal(url, 'https://api.typesafe.ai/v1/systemone')
      assert.deepEqual(JSON.parse((init as { body: string }).body), request)
      const status = statuses.shift()!
      return status === 200
        ? Response.json(response())
        : new Response('private provider details', { status })
    }
    assert.deepEqual(await evaluateWithJev('test-key', request), response())
    assert.equal(count, 2)

    count = 0
    globalThis.fetch = async () => {
      count++
      return new Response('private provider details', { status: 422 })
    }
    await assert.rejects(() => evaluateWithJev('test-key', request), {
      message: 'Jev returned HTTP 422.',
    })
    assert.equal(count, 1)
  } finally {
    globalThis.fetch = original
  }
})

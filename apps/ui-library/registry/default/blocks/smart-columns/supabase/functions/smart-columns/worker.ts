import type { JSONValue, Sql } from 'npm:postgres@3.4.7'

import {
  decodeAnswers,
  fingerprint,
  questionsFor,
  validateTables,
  type SmartColumn,
  type SmartTable,
} from './schema.ts'

type StoredAnswer = { output: unknown } & Record<string, unknown>

type Claim = {
  lease: string
  message_id: string
  target: string
  input: Record<string, unknown> | null
  fingerprints: Record<string, string>
  result: { model?: string; columns?: Record<string, StoredAnswer> } | null
}

export type JevRequest = {
  model: string
  state: Record<string, unknown>
  questions: Record<string, unknown>
}

export type Evaluate = (request: JevRequest) => Promise<unknown>

// Rows claimed at a time, and how long one wakeup keeps claiming before it hands
// off to a fresh invocation. Stay under pg_net's 60-second request timeout.
const batchSize = 8
const budgetMs = 40_000

async function evaluateClaim(
  sql: Sql,
  table: SmartTable,
  model: string,
  claim: Claim,
  evaluate: Evaluate
) {
  try {
    const input = claim.input ?? {}
    const missing = table.inputs.filter((name) => !Object.hasOwn(input, name))
    if (missing.length) throw new Error(`${table.table} has no input column ${missing.join(', ')}.`)

    // Ask Jev only about outputs whose inputs or instructions changed.
    const fingerprints: Record<string, string> = {}
    const stale: Record<string, SmartColumn> = {}
    for (const [name, column] of Object.entries(table.columns)) {
      fingerprints[name] = await fingerprint(model, input, column)
      if (claim.fingerprints[name] !== fingerprints[name]) stale[name] = column
    }
    let answered = { outputs: {}, details: {} as Record<string, StoredAnswer>, model: '' }
    if (Object.keys(stale).length) {
      answered = decodeAnswers(
        stale,
        await evaluate({ model, state: input, questions: questionsFor(stale) })
      )
    }

    // Keep answers for configured outputs only, so removed outputs drop out.
    const previous = claim.result?.columns ?? {}
    const columns = Object.fromEntries(
      Object.keys(table.columns)
        .map((name) => [name, answered.details[name] ?? previous[name]] as const)
        .filter(([, answer]) => answer)
    )
    const status = Object.values(columns).some((answer) => answer.output === null)
      ? 'needs_review'
      : 'ready'
    const result = { model: answered.model || claim.result?.model || model, columns }
    await sql`select smart_columns.complete(
      ${claim.lease}, ${claim.message_id}, ${sql.json(answered.outputs)},
      ${sql.json(result as JSONValue)}, ${sql.json(fingerprints)}, ${status}
    )`
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save smart columns.'
    await sql`select smart_columns.fail(${claim.lease}, ${claim.message_id}, ${message})`
  }
}

// Claims and evaluates due rows until none remain or the time budget runs out.
export async function drain(sql: Sql, tables: SmartTable[], model: string, evaluate: Evaluate) {
  validateTables(tables)
  const byName = new Map(tables.map((table) => [table.table, table]))
  const inputs = Object.fromEntries(tables.map((table) => [table.table, table.inputs]))
  const deadline = Date.now() + budgetMs
  let processed = 0
  while (Date.now() < deadline) {
    const claims = await sql<Claim[]>`
      select * from smart_columns.claim(${batchSize}, ${sql.json(inputs)})
    `
    if (!claims.length) return processed
    await Promise.all(
      claims.map((claim) => evaluateClaim(sql, byName.get(claim.target)!, model, claim, evaluate))
    )
    processed += claims.length
  }
  await sql`select smart_columns.wake()`
  return processed
}

// Retries rate limits and server errors briefly, so a busy moment stays fast.
export async function evaluateWithJev(apiKey: string, request: JevRequest) {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch('https://api.typesafe.ai/v1/systemone', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(15000),
    })
    if (response.ok) return await response.json()
    await response.body?.cancel()
    if (attempt < 2 && (response.status === 429 || response.status >= 500)) {
      await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt))
      continue
    }
    throw new Error(`Jev returned HTTP ${response.status}.`)
  }
}

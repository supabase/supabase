// Requires a disposable Supabase Postgres instance. Never point this at a project.
import assert from 'node:assert/strict'
import postgres from 'npm:postgres@3.4.7'

import { model, tables } from './config.ts'
import type { SmartTable } from './schema.ts'
import { drain, type Evaluate } from './worker.ts'

type Answers = { model: string; answers: Record<string, Record<string, unknown>> }

// Answers every question confidently: the first option, yes, and a score of 1.2.
function answer(questions: Record<string, unknown>): Answers {
  const answers: Answers['answers'] = {}
  for (const [name, question] of Object.entries(
    questions as Record<string, { type: string; criteria?: unknown }>
  )) {
    if (question.type === 'noul') {
      answers[name] = { type: 'noul', noul: 0.95 }
    } else if (question.type === 'choice') {
      const [first, ...rest] = Object.keys(question.criteria as object)
      answers[name] = {
        type: 'choice',
        choice: first,
        confidence: 0.9,
        probabilities: Object.fromEntries([
          [first, 0.9],
          ...rest.map((option) => [option, 0.1 / rest.length]),
        ]),
      }
    } else {
      answers[name] = {
        type: 'score',
        score: 1.2,
        confidence: 0.8,
        probabilities: { '0': 0, '1': 0.8, '2': 0.2 },
      }
    }
  }
  return { model, answers }
}

const confident: Evaluate = async ({ questions }) => answer(questions)
const mustNotAsk: Evaluate = async () => {
  throw new Error('Jev must not be asked')
}
const [feedback] = tables
const withColumns = (columns: SmartTable['columns']): SmartTable[] => [{ ...feedback, columns }]

Deno.test('installed schema and worker with real Postgres and Supabase Queues', async (t) => {
  const url = Deno.env.get('SMART_COLUMNS_TEST_DB_URL')!
  assert(
    ['127.0.0.1', 'localhost'].includes(new URL(url).hostname),
    'Use a disposable local database'
  )
  const sql = postgres(url, { max: 8, prepare: false, connect_timeout: 5, onnotice: () => {} })
  let ownsFixture = false
  try {
    const [existing] = await sql`
      select to_regclass('public.feedback') as feedback, to_regnamespace('smart_columns') as smart,
        to_regclass('pgmq.q_smart_columns') as queue,
        (select count(*) from vault.secrets
         where name in ('smart_columns_url', 'smart_columns_secret'))::int as secrets
    `
    assert.equal(existing.feedback, null, 'Test requires an unused database')
    assert.equal(existing.smart, null, 'Test requires an unused database')
    assert.equal(existing.queue, null, 'Test requires an unused database')
    assert.equal(existing.secrets, 0, 'Test requires an unused database')
    ownsFixture = true
    await sql`create type public.feedback_category as enum ('bug', 'feature', 'praise', 'other')`
    await sql`create table public.feedback (
      id bigint primary key, title text, body text, private_note text, owner_id text,
      category public.feedback_category, needs_response boolean,
      severity numeric check (severity between 0 and 2)
    )`
    await sql`alter table public.feedback enable row level security`
    await sql`grant select, insert, update, delete on public.feedback to authenticated`
    await sql`create policy own_rows on public.feedback to authenticated using (owner_id = current_setting('test.owner', true)) with check (owner_id = current_setting('test.owner', true))`
    // The trusted, installed schema file.
    await sql.unsafe(
      await Deno.readTextFile(new URL('../../schemas/smart_columns.sql', import.meta.url))
    )
    await sql`create trigger smart_columns after insert or update or delete on public.feedback for each row execute function smart_columns.enqueue()`

    const input = { title: 'Help', body: 'Export is broken' }
    const insert = async (id: string) => {
      await sql`insert into public.feedback (id, title, body, private_note, owner_id) values (${id}, ${input.title}, ${input.body}, 'must not reach Jev', 'a')`
    }
    const state = async (id: string) =>
      (await sql`select * from smart_columns.row_state where row_id = ${id}`)[0]
    const row = async (id: string) => (await sql`select * from public.feedback where id = ${id}`)[0]
    const messages = async () =>
      Number((await sql`select count(*) from pgmq.q_smart_columns`)[0].count)
    const archived = async () =>
      Number((await sql`select count(*) from pgmq.a_smart_columns`)[0].count)
    // Skips retry delays and expires claims.
    const due = async () => {
      await sql`update pgmq.q_smart_columns set vt = now()`
    }
    const backfill = async () =>
      Number((await sql`select smart_columns.backfill('public.feedback')`)[0].backfill)
    const asked = (log: string[][]): Evaluate => {
      return async ({ questions }) => {
        log.push(Object.keys(questions).sort())
        return answer(questions)
      }
    }

    await t.step(
      'an insert is evaluated and the worker write does not queue it again',
      async () => {
        await insert('9007199254740993')
        assert.equal((await state('9007199254740993')).status, 'pending')
        assert.equal(await messages(), 1)
        const count = await drain(sql, tables, model, async ({ state, questions }) => {
          assert.deepEqual(state, input)
          return answer(questions)
        })
        assert.equal(count, 1)
        const saved = await row('9007199254740993')
        assert.equal(saved.category, 'bug')
        assert.equal(saved.needs_response, true)
        assert.equal(Number(saved.severity), 1.2)
        const done = await state('9007199254740993')
        assert.equal(done.status, 'ready')
        assert.deepEqual(Object.keys(done.fingerprints).sort(), [
          'category',
          'needs_response',
          'severity',
        ])
        assert.equal(await messages(), 0)
      }
    )

    await t.step('unrelated updates skip Jev and no-op updates are not queued', async () => {
      await sql`update public.feedback set private_note = 'changed' where id = 9007199254740993`
      assert.equal((await state('9007199254740993')).status, 'pending')
      await drain(sql, tables, model, mustNotAsk)
      assert.equal((await state('9007199254740993')).status, 'ready')
      const before = await state('9007199254740993')
      await sql`update public.feedback set title = title where id = 9007199254740993`
      assert.deepEqual(await state('9007199254740993'), before)
      assert.equal(await messages(), 0)
    })

    await t.step('uncertain answers are stored as NULL with their details', async () => {
      await insert('2')
      await drain(sql, tables, model, async ({ questions }) => {
        const uncertain = answer(questions)
        uncertain.answers.needs_response.noul = 0.5
        return uncertain
      })
      assert.equal((await row('2')).needs_response, null)
      assert.equal((await state('2')).status, 'needs_review')
      assert.equal((await state('2')).result.columns.needs_response.probability, 0.5)
    })

    await t.step('ignored inserts do not queue and upserts send the saved input', async () => {
      const before = await state('2')
      await sql`insert into public.feedback (id, title, body) values (2, 'ignored', 'not saved') on conflict (id) do nothing`
      assert.deepEqual(await state('2'), before)
      assert.equal(await messages(), 0)
      await sql`insert into public.feedback (id, title, body) values (2, 'Help', 'upserted content') on conflict (id) do update set body = excluded.body`
      await drain(sql, tables, model, async ({ state, questions }) => {
        assert.equal(state.body, 'upserted content')
        return answer(questions)
      })
      assert.equal((await state('2')).status, 'ready')
    })

    await t.step('repeated edits send one message and use the latest input', async () => {
      await sql`update public.feedback set body = 'first edit' where id = 2`
      await sql`update public.feedback set body = 'second edit' where id = 2`
      assert.equal(await messages(), 1)
      let calls = 0
      await drain(sql, tables, model, async ({ state, questions }) => {
        calls++
        assert.equal(state.body, 'second edit')
        return answer(questions)
      })
      assert.equal(calls, 1)
    })

    await t.step('an edit during evaluation discards the older answer', async () => {
      await insert('3')
      const bodies: unknown[] = []
      await drain(sql, tables, model, async ({ state, questions }) => {
        bodies.push(state.body)
        await sql`update public.feedback set body = 'newer input' where id = 3`
        return answer(questions)
      })
      assert.deepEqual(bodies, ['Export is broken', 'newer input'])
      assert.equal((await row('3')).category, 'bug')
      assert.equal((await state('3')).status, 'ready')
      assert.equal(await messages(), 0)
    })

    await t.step('failures back off, then archive the message and fail the row', async () => {
      await insert('4')
      const fail = async () => {
        throw new Error('Jev returned HTTP 429.')
      }
      for (let attempt = 1; attempt <= 5; attempt++) {
        await due()
        await drain(sql, tables, model, fail)
        assert.equal((await state('4')).status, attempt < 5 ? 'pending' : 'failed')
      }
      assert.equal((await state('4')).error, 'Jev returned HTTP 429.')
      assert.equal(await messages(), 0)
      assert.equal(await archived(), 1)
      await sql`delete from public.feedback where id = 4`
    })

    await t.step('an expired claim is reclaimed and fences out its first worker', async () => {
      await insert('7')
      await drain(sql, tables, model, async ({ questions }) => {
        await due()
        await drain(sql, tables, model, async ({ questions }) => {
          const newer = answer(questions)
          newer.answers.category.choice = 'feature'
          newer.answers.category.probabilities = { bug: 0.05, feature: 0.9, praise: 0, other: 0.05 }
          return newer
        })
        return answer(questions)
      })
      assert.equal((await row('7')).category, 'feature')
      assert.equal(await messages(), 0)
    })

    await t.step('a message read a sixth time is archived and fails its row', async () => {
      await insert('8')
      await sql`update pgmq.q_smart_columns set read_ct = 5`
      await drain(sql, tables, model, mustNotAsk)
      assert.equal((await state('8')).status, 'failed')
      assert.equal(await archived(), 2)
      await sql`delete from public.feedback where id = 8`
    })

    await t.step('deleting a row discards its state and message', async () => {
      await insert('6')
      await sql`delete from public.feedback where id = 6`
      await drain(sql, tables, model, mustNotAsk)
      assert.equal(await state('6'), undefined)
      assert.equal(await messages(), 0)
    })

    await t.step('rows of a table missing from config.ts fail with a clear error', async () => {
      await sql`create table public.notes (id bigint primary key, body text)`
      await sql`create trigger smart_columns after insert or update or delete on public.notes for each row execute function smart_columns.enqueue()`
      await sql`insert into public.notes values (1, 'hello')`
      await drain(sql, tables, model, mustNotAsk)
      const [notes] =
        await sql`select * from smart_columns.row_state where target = 'public.notes'::regclass`
      assert.equal(notes.status, 'failed')
      assert.match(notes.error, /No configuration for public.notes/)
      assert.equal(await archived(), 3)
      await sql`drop table public.notes`
    })

    // Rows 9007199254740993, 2, 3, and 7 remain, all evaluated with the example config.
    const changed = withColumns({
      ...feedback.columns,
      needs_response: { type: 'noul', instructions: 'Does the author expect a reply?' },
    })

    await t.step('a changed instruction asks Jev only about that output', async () => {
      assert.equal(await backfill(), 4)
      const log: string[][] = []
      await drain(sql, changed, model, asked(log))
      assert.deepEqual(log, Array(4).fill(['needs_response']))
    })

    const sentiment = {
      type: 'choice' as const,
      instructions: "What is the author's tone?",
      criteria: { positive: 'Pleased', neutral: 'Matter of fact', negative: 'Frustrated' },
    }

    await t.step('a new output asks Jev only the new question', async () => {
      await sql`create type public.feedback_sentiment as enum ('positive', 'neutral', 'negative')`
      await sql`alter table public.feedback add column sentiment public.feedback_sentiment`
      await backfill()
      const log: string[][] = []
      await drain(sql, withColumns({ ...changed[0].columns, sentiment }), model, asked(log))
      assert.deepEqual(log, Array(4).fill(['sentiment']))
      assert.equal((await row('2')).sentiment, 'positive')
    })

    await t.step('a removed output asks nothing and keeps its values', async () => {
      const { category, needs_response } = changed[0].columns
      await backfill()
      await drain(sql, withColumns({ category, needs_response, sentiment }), model, mustNotAsk)
      const done = await state('2')
      assert.equal(done.status, 'ready')
      assert.deepEqual(Object.keys(done.fingerprints).sort(), [
        'category',
        'needs_response',
        'sentiment',
      ])
      assert.equal(Number((await row('2')).severity), 1.2)
    })

    await t.step('an output without a column is asked again once the column exists', async () => {
      const mood = { type: 'noul' as const, instructions: 'Is the author upset?' }
      const { category, needs_response } = changed[0].columns
      const config = withColumns({ category, needs_response, sentiment, mood })
      await backfill()
      const log: string[][] = []
      await drain(sql, config, model, asked(log))
      assert.deepEqual(log, Array(4).fill(['mood']))
      assert.equal('mood' in (await state('2')).fingerprints, false)

      await sql`alter table public.feedback add column mood boolean`
      await backfill()
      log.length = 0
      await drain(sql, config, model, asked(log))
      assert.deepEqual(log, Array(4).fill(['mood']))
      assert.equal((await row('2')).mood, true)
    })

    await t.step('database errors are recorded with their cause', async () => {
      await sql`alter table public.feedback add constraint no_bugs check (category is distinct from 'bug') not valid`
      await insert('13')
      await drain(sql, tables, model, confident)
      const failed = await state('13')
      assert.equal(failed.status, 'pending')
      assert.match(failed.error, /violates check constraint "no_bugs"/)
      await sql`alter table public.feedback drop constraint no_bugs`
      await sql`delete from public.feedback where id = 13`
      // The deleted row's retry message is discarded when it is next read.
      await due()
      await drain(sql, tables, model, mustNotAsk)
      assert.equal(await messages(), 0)
    })

    await t.step('application RLS is unchanged and the queue is private', async () => {
      await sql.begin(async (tx) => {
        await tx`set local role authenticated`
        await tx`set local test.owner = 'b'`
        assert.equal((await tx`select * from public.feedback`).length, 0)
      })
      for (const role of ['anon', 'authenticated']) {
        for (const statement of [
          'select * from smart_columns.row_state',
          'select * from pgmq.q_smart_columns',
          `select * from smart_columns.claim(1, '{}')`,
          "select smart_columns.backfill('public.feedback')",
        ]) {
          await assert.rejects(
            () =>
              sql.begin(async (tx) => {
                await tx.unsafe(`set local role ${role}`)
                await tx.unsafe(statement)
              }),
            { code: '42501' }
          )
        }
      }
    })

    await t.step('backfill requires the trigger', async () => {
      await sql`create table public.untracked (id bigint primary key)`
      await assert.rejects(() => sql`select smart_columns.backfill('public.untracked')`, {
        message: /Add the smart_columns trigger/,
      })
      await sql`drop table public.untracked`
    })

    await t.step('cron recovery never starts a second worker while one is busy', async () => {
      await sql`select vault.create_secret('http://127.0.0.1:9/', 'smart_columns_url')`
      await sql`select vault.create_secret(${'x'.repeat(32)}, 'smart_columns_secret')`
      // A repeatable read snapshot hides pg_net removing requests it has already sent.
      const dispatched = (recover: boolean) =>
        sql.begin('isolation level repeatable read', async (tx) => {
          const count = async () =>
            Number((await tx`select count(*) from net.http_request_queue`)[0].count)
          const before = await count()
          await tx`select smart_columns.wake(${recover})`
          return (await count()) - before
        })
      await insert('10')
      assert.equal(await dispatched(true), 1)
      await sql`select * from smart_columns.claim(1, ${sql.json({ 'public.feedback': ['title', 'body'] })})`
      await insert('11')
      assert.equal(await dispatched(true), 0)
      assert.equal(await dispatched(false), 1)
    })
  } finally {
    if (ownsFixture) {
      await sql`drop table if exists public.feedback, public.notes, public.untracked cascade`
      await sql`drop type if exists public.feedback_category, public.feedback_sentiment`
      const [installed] =
        await sql`select to_regclass('cron.job') as cron, to_regclass('pgmq.q_smart_columns') as queue`
      if (installed.cron)
        await sql`select cron.unschedule(jobid) from cron.job where jobname = 'smart-columns-retry'`
      if (installed.queue) await sql`select pgmq.drop_queue('smart_columns')`
      await sql`drop schema if exists smart_columns cascade`
      await sql`delete from vault.secrets where name in ('smart_columns_url', 'smart_columns_secret')`
    }
    await sql.end()
  }
})

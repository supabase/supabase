const assert = require('node:assert/strict')
const { test } = require('node:test')

const { deploymentIdFromTargetUrl, resolvePreviewUrl } = require('./waitForVercelPreview.js')

const CONTEXT = 'Vercel – docs'
const HEAD = 'head000000000000000000000000000000000000'
const OLDER = 'older00000000000000000000000000000000000'
const OLDEST = 'oldest0000000000000000000000000000000000'

function success(id, description = 'Deployment has completed') {
  return { state: 'success', description, target_url: `https://vercel.com/supabase/docs/${id}` }
}

function fakeClients({ statuses = {}, deployments = {}, prShas = [] }) {
  const calls = { latestStatus: [], deployment: [], pullRequestShas: 0 }
  return {
    calls,
    async latestStatus(sha) {
      calls.latestStatus.push(sha)
      const list = statuses[sha]
      return Array.isArray(list) ? list.shift() : list
    },
    async pullRequestShas() {
      calls.pullRequestShas += 1
      return prShas
    },
    async deployment(targetUrl) {
      calls.deployment.push(targetUrl)
      return deployments[deploymentIdFromTargetUrl(targetUrl)]
    },
  }
}

function options(overrides = {}) {
  const log = []
  return {
    headSha: HEAD,
    prNumber: 50119,
    statusContext: CONTEXT,
    timeoutMs: 1000,
    pollIntervalMs: 10,
    sleep: async () => {},
    now: () => 0,
    log: (line) => log.push(line),
    logLines: log,
    ...overrides,
  }
}

test('deploymentIdFromTargetUrl prefixes bare inspector ids and keeps dpl_ ids', () => {
  assert.equal(
    deploymentIdFromTargetUrl('https://vercel.com/supabase/docs/Avoo1vcp'),
    'dpl_Avoo1vcp'
  )
  assert.equal(
    deploymentIdFromTargetUrl('https://vercel.com/supabase/docs/dpl_Avoo1vcp'),
    'dpl_Avoo1vcp'
  )
  assert.throws(() => deploymentIdFromTargetUrl('https://vercel.com'), /deployment ID/)
})

test('returns the head deployment when it is READY', async () => {
  const clients = fakeClients({
    statuses: { [HEAD]: success('dpl_head') },
    deployments: { dpl_head: { url: 'https://docs-head.vercel.app', state: 'READY' } },
  })

  const url = await resolvePreviewUrl(clients, options())

  assert.equal(url, 'https://docs-head.vercel.app')
  assert.equal(clients.calls.pullRequestShas, 0)
})

test('polls while the head status is pending', async () => {
  let clock = 0
  const sleeps = []
  const clients = fakeClients({
    statuses: { [HEAD]: [undefined, { state: 'pending' }, success('dpl_head')] },
    deployments: { dpl_head: { url: 'https://docs-head.vercel.app', state: 'READY' } },
  })

  const url = await resolvePreviewUrl(
    clients,
    options({
      now: () => clock,
      sleep: async (ms) => {
        sleeps.push(ms)
        clock += ms
      },
    })
  )

  assert.equal(url, 'https://docs-head.vercel.app')
  assert.deepEqual(sleeps, [10, 10])
})

test('falls back to the newest earlier commit with a READY deployment when the head build was skipped', async () => {
  const clients = fakeClients({
    prShas: [HEAD, OLDER, OLDEST],
    statuses: {
      [HEAD]: success('dpl_head', 'Skipped - Not affected'),
      [OLDER]: undefined,
      [OLDEST]: success('dpl_oldest'),
    },
    deployments: {
      dpl_head: { url: 'https://docs-head.vercel.app', state: 'CANCELED' },
      dpl_oldest: { url: 'https://docs-oldest.vercel.app', state: 'READY' },
    },
  })
  const opts = options()

  const url = await resolvePreviewUrl(clients, opts)

  assert.equal(url, 'https://docs-oldest.vercel.app')
  assert.deepEqual(clients.calls.latestStatus, [HEAD, OLDER, OLDEST])
  assert.ok(opts.logLines.some((line) => line.includes('Skipped - Not affected')))
  assert.ok(opts.logLines.some((line) => line.includes(OLDEST.slice(0, 10))))
})

test('skips earlier commits whose deployment is not READY', async () => {
  const clients = fakeClients({
    prShas: [HEAD, OLDER, OLDEST],
    statuses: {
      [HEAD]: success('dpl_head', 'Skipped - Not affected'),
      [OLDER]: success('dpl_older', 'Skipped - Not affected'),
      [OLDEST]: success('dpl_oldest'),
    },
    deployments: {
      dpl_head: { url: 'https://docs-head.vercel.app', state: 'CANCELED' },
      dpl_older: { url: 'https://docs-older.vercel.app', state: 'CANCELED' },
      dpl_oldest: { url: 'https://docs-oldest.vercel.app', state: 'READY' },
    },
  })

  const url = await resolvePreviewUrl(clients, options())

  assert.equal(url, 'https://docs-oldest.vercel.app')
})

test('throws when the head build was skipped and no earlier commit has a READY deployment', async () => {
  const clients = fakeClients({
    prShas: [HEAD, OLDER],
    statuses: {
      [HEAD]: success('dpl_head', 'Skipped - Not affected'),
      [OLDER]: { state: 'failure', target_url: 'https://vercel.com/supabase/docs/dpl_older' },
    },
    deployments: { dpl_head: { url: 'https://docs-head.vercel.app', state: 'CANCELED' } },
  })

  await assert.rejects(resolvePreviewUrl(clients, options()), /No READY "Vercel – docs" preview/)
})

test('throws when the head build was skipped and no pull request number is available', async () => {
  const clients = fakeClients({
    statuses: { [HEAD]: success('dpl_head', 'Skipped - Not affected') },
    deployments: { dpl_head: { url: 'https://docs-head.vercel.app', state: 'CANCELED' } },
  })

  await assert.rejects(resolvePreviewUrl(clients, options({ prNumber: undefined })), /PR_NUMBER/)
  assert.equal(clients.calls.pullRequestShas, 0)
})

test('throws when the head deployment is in any state other than READY or CANCELED', async () => {
  const clients = fakeClients({
    statuses: { [HEAD]: success('dpl_head') },
    deployments: { dpl_head: { url: 'https://docs-head.vercel.app', state: 'ERROR' } },
  })

  await assert.rejects(resolvePreviewUrl(clients, options()), /ERROR/)
})

test('throws when the head status reports a failed deployment', async () => {
  const clients = fakeClients({ statuses: { [HEAD]: { state: 'failure' } } })

  await assert.rejects(resolvePreviewUrl(clients, options()), /deployment failed/)
})

test('throws when the head status never resolves before the timeout', async () => {
  let clock = 0
  const clients = fakeClients({ statuses: { [HEAD]: { state: 'pending' } } })

  await assert.rejects(
    resolvePreviewUrl(
      clients,
      options({
        timeoutMs: 25,
        now: () => clock,
        sleep: async (ms) => {
          clock += ms
        },
      })
    ),
    /Timed out/
  )
})

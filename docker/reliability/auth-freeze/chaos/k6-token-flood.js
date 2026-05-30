// k6-token-flood.js
//
// Reproduces the freeze: floods POST /auth/v1/token with 200 VUs for 60s.
// When combined with chaos/pg-block.sh (which holds N DB connections),
// the GoTrue process saturates the connection pool, every token request
// queues behind a context-less acquire, and the legacy /health probe
// stays green.
//
// Pass / fail thresholds are tuned so this also doubles as a CI
// regression gate (see `thresholds` below): the test FAILS if either
// p99 latency >2s OR error rate >1 % under the configured load.
//
// Required env (passed as -e KEY=VALUE):
//   BASE_URL       Kong front-door, e.g. http://localhost:8000
//   ANON_KEY       Anon JWT for the apikey header
//   TEST_EMAIL     Pre-seeded user with a known password (signup beforehand)
//   TEST_PASSWORD
//
// Optional:
//   VUS            default 200
//   DURATION       default 60s
//   RAMP           default 10s ramp up/down
//   HEALTH_URL     default ${BASE_URL}/auth/v1/health
//   DEEP_URL       default http://localhost:9101/probe (deep probe sidecar)
//
// Usage:
//   docker run --rm -i --network supabase_default \
//     -e BASE_URL=http://kong:8000 -e ANON_KEY=$ANON_KEY \
//     -e TEST_EMAIL=probe@example.com -e TEST_PASSWORD='ProbePass1!' \
//     grafana/k6 run - < chaos/k6-token-flood.js

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

const BASE_URL      = __ENV.BASE_URL      || 'http://localhost:8000'
const ANON_KEY      = __ENV.ANON_KEY      || ''
const TEST_EMAIL    = __ENV.TEST_EMAIL    || 'probe@example.com'
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'ProbePass1!'
const VUS           = parseInt(__ENV.VUS      || '200', 10)
const DURATION      = __ENV.DURATION      || '60s'
const RAMP          = __ENV.RAMP          || '10s'
const HEALTH_URL    = __ENV.HEALTH_URL    || `${BASE_URL}/auth/v1/health`
const DEEP_URL      = __ENV.DEEP_URL      || 'http://localhost:9101/probe'

const tokenErrors        = new Rate('token_errors')
const tokenLatency       = new Trend('token_latency_ms', true)
const cheapHealthOK      = new Rate('cheap_health_ok')
const deepProbeOK        = new Rate('deep_probe_ok')
const tokenAttempted     = new Counter('token_attempted_total')
const tokenSucceeded     = new Counter('token_succeeded_total')

export const options = {
  // Three scenarios run in parallel:
  //   - flood     hammers /token
  //   - cheap     polls /health  (the legacy probe; should stay 200)
  //   - deep      polls /probe   (the new sidecar; should flip to 503)
  scenarios: {
    flood: {
      executor: 'ramping-vus',
      exec: 'flood',
      startVUs: 0,
      stages: [
        { duration: RAMP,     target: VUS },
        { duration: DURATION, target: VUS },
        { duration: RAMP,     target: 0 },
      ],
      gracefulRampDown: '5s',
    },
    cheap: {
      executor: 'constant-vus',
      exec: 'cheap',
      vus: 1,
      duration: __addDur(DURATION, RAMP, RAMP),
    },
    deep: {
      executor: 'constant-vus',
      exec: 'deep',
      vus: 1,
      duration: __addDur(DURATION, RAMP, RAMP),
    },
  },

  thresholds: {
    // Hard regression gates — exit code non-zero if violated.
    'token_errors':                ['rate<0.01'],          // <1 % errors
    'token_latency_ms':            ['p(99)<2000'],         // p99 under 2s
    // Soft gates: surface the freeze, do not fail the run.
    'cheap_health_ok':             ['rate>0.99'],          // /health should stay up
    // Deep probe is allowed to flip during the chaos run — that's the
    // whole point — so we don't assert on it.
  },

  // Bound the test's resource footprint so it can run in CI containers.
  noConnectionReuse: false,
  discardResponseBodies: true,
  summaryTrendStats: ['avg', 'min', 'med', 'p(95)', 'p(99)', 'max'],
}

function __addDur (...durs) {
  // Coarse second-only adder; k6 accepts strings like "80s".
  let total = 0
  for (const d of durs) {
    const m = /^(\d+)(s|m)$/.exec(d)
    if (!m) continue
    total += parseInt(m[1], 10) * (m[2] === 'm' ? 60 : 1)
  }
  return `${total}s`
}

export function flood () {
  tokenAttempted.add(1)
  const url = `${BASE_URL}/auth/v1/token?grant_type=password`
  const payload = JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
    },
    timeout: '15s',
    tags: { route: 'token' },
  }
  const res = http.post(url, payload, params)
  tokenLatency.add(res.timings.duration)
  const ok = check(res, {
    'status is 200': r => r.status === 200,
  })
  if (ok) tokenSucceeded.add(1)
  tokenErrors.add(!ok)
}

export function cheap () {
  const r = http.get(HEALTH_URL, { timeout: '2s', tags: { route: 'cheap-health' } })
  cheapHealthOK.add(r.status === 200)
  sleep(1)
}

export function deep () {
  const r = http.get(DEEP_URL, { timeout: '5s', tags: { route: 'deep-probe' } })
  deepProbeOK.add(r.status === 200)
  sleep(1)
}

export function handleSummary (data) {
  // One-line summary line for CI log parsers, plus the default text summary.
  const t = data.metrics
  const line = JSON.stringify({
    p99_token_ms: t.token_latency_ms?.values['p(99)'] ?? null,
    p95_token_ms: t.token_latency_ms?.values['p(95)'] ?? null,
    err_rate:     t.token_errors?.values.rate ?? null,
    cheap_up:     t.cheap_health_ok?.values.rate ?? null,
    deep_up:      t.deep_probe_ok?.values.rate ?? null,
    succeeded:    t.token_succeeded_total?.values.count ?? 0,
    attempted:    t.token_attempted_total?.values.count ?? 0,
  })
  return {
    stdout: `\n=== k6-token-flood SUMMARY ${line}\n`,
    'summary.json': JSON.stringify(data, null, 2),
  }
}

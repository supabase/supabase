import assert from 'node:assert/strict'
import test from 'node:test'

import { buildChildEnv } from '../../shared/run-suite.ts'

const config = { pagePathsEnv: 'PAGES', a11yPagePathsEnv: 'A11Y_PAGES' }

test('passes the resolved scan list to the suite', () => {
  const env = buildChildEnv(config, { pages: ['/a', '/b'], a11yPages: ['/a'] }, {})

  assert.equal(env.PAGES, '/a,/b')
  assert.equal(env.A11Y_PAGES, '/a')
})

test('clears a stale scan list when none was resolved', () => {
  const env = buildChildEnv(config, { pages: ['/a', '/b'] }, { A11Y_PAGES: '/stale' })

  assert.equal(env.PAGES, '/a,/b')
  assert.equal(env.A11Y_PAGES, undefined)
})

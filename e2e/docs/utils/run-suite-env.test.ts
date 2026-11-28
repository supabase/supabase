import assert from 'node:assert/strict'
import test from 'node:test'

import { buildChildEnv, readExplicitPages } from '../../shared/run-suite.ts'

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

test('keeps the scan list when both page lists are set, as in CI', () => {
  const env = { PAGES: '/a,/b', A11Y_PAGES: '/a' }
  const resolved = readExplicitPages(config, env)

  assert.deepEqual(resolved, { pages: ['/a', '/b'], a11yPages: ['/a'] })
  assert.equal(buildChildEnv(config, resolved!, env).A11Y_PAGES, '/a')
})

test('leaves the scan list unset when only the page list is set', () => {
  const resolved = readExplicitPages(config, { PAGES: '/a,/b' })

  assert.deepEqual(resolved, { pages: ['/a', '/b'] })
})

test('returns null when no page list is set', () => {
  assert.equal(readExplicitPages(config, { A11Y_PAGES: '/a' }), null)
})

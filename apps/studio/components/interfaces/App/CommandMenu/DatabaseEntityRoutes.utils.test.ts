import { describe, expect, it } from 'vitest'

import {
  getIndexEditorRoute,
  getPolicyEditorRoute,
  getTableEditorRoute,
  getTriggerEditorRoute,
} from './DatabaseEntityRoutes.utils'

// The policy, trigger, function and index routes are built by one shared
// helper, so the query string is covered once here. The cases below only cover
// where a route genuinely departs from it.
describe('the shared schema and edit query string', () => {
  it('encodes the schema, which is free text', () => {
    expect(getPolicyEditorRoute('abc', { id: 7, schema: 'my schema&x' })).toBe(
      '/project/abc/database/policies?schema=my%20schema%26x&edit=7'
    )
  })
})

describe('getTriggerEditorRoute', () => {
  it('links to the list page directly, since the index route drops the query string', () => {
    expect(getTriggerEditorRoute('abc', { id: 5, schema: 'public' })).toBe(
      '/project/abc/database/triggers/data?schema=public&edit=5'
    )
  })
})

describe('getIndexEditorRoute', () => {
  it('matches the index by name, encoded, rather than by id', () => {
    expect(getIndexEditorRoute('abc', { name: 'idx posts&author', schema: 'public' })).toBe(
      '/project/abc/database/indexes?schema=public&edit=idx%20posts%26author'
    )
  })
})

describe('getTableEditorRoute', () => {
  it('puts the table id in the path rather than an edit param', () => {
    expect(getTableEditorRoute('abc', { id: 42, schema: 'my schema' })).toBe(
      '/project/abc/editor/42?schema=my%20schema'
    )
  })
})

import { describe, expect, test } from 'vitest'

import {
  buildTableEditorSchemaListPath,
  readSidebarQueryParam,
  shouldLeaveOpenTableForSchema,
} from './TableEditorMenu.utils'

describe('shouldLeaveOpenTableForSchema', () => {
  test('leaves the open table when the schema changes', () => {
    expect(
      shouldLeaveOpenTableForSchema({
        entityId: 25837,
        nextSchema: 'auth',
        currentSchema: 'public',
      })
    ).toBe(true)
  })

  test('stays on the table when the schema is unchanged', () => {
    expect(
      shouldLeaveOpenTableForSchema({
        entityId: 25837,
        nextSchema: 'public',
        currentSchema: 'public',
      })
    ).toBe(false)
  })

  test('stays on the list when no table is open', () => {
    expect(
      shouldLeaveOpenTableForSchema({
        entityId: undefined,
        nextSchema: 'auth',
        currentSchema: 'public',
      })
    ).toBe(false)
  })

  test('ignores a non-numeric entity id', () => {
    expect(
      shouldLeaveOpenTableForSchema({
        entityId: Number.NaN,
        nextSchema: 'auth',
        currentSchema: 'public',
      })
    ).toBe(false)
  })
})

describe('buildTableEditorSchemaListPath', () => {
  test('builds the schema list path', () => {
    expect(buildTableEditorSchemaListPath({ projectRef: 'default', schema: 'auth' })).toBe(
      '/project/default/editor?schema=auth'
    )
  })

  test('keeps the sidebar param', () => {
    expect(
      buildTableEditorSchemaListPath({
        projectRef: 'default',
        schema: 'extensions',
        sidebar: 'ai-assistant',
      })
    ).toBe('/project/default/editor?schema=extensions&sidebar=ai-assistant')
  })

  test('encodes schema names', () => {
    expect(buildTableEditorSchemaListPath({ projectRef: 'default', schema: 'custom schema' })).toBe(
      '/project/default/editor?schema=custom+schema'
    )
  })
})

describe('readSidebarQueryParam', () => {
  test('returns a sidebar value', () => {
    expect(readSidebarQueryParam('ai-assistant')).toBe('ai-assistant')
  })

  test('returns the first repeated value', () => {
    expect(readSidebarQueryParam(['advisor-panel', 'help-panel'])).toBe('advisor-panel')
  })

  test('ignores a missing or empty value', () => {
    expect(readSidebarQueryParam(undefined)).toBeUndefined()
    expect(readSidebarQueryParam('')).toBeUndefined()
  })
})

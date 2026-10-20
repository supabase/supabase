import { describe, expect, test } from 'vitest'

import { buildTableEditorSchemaListPath } from './TableEditorMenu.utils'

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

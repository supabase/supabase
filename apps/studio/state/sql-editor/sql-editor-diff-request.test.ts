import { beforeEach, describe, expect, it } from 'vitest'

import { sqlEditorDiffRequestState } from './sql-editor-diff-request'
import { DiffType } from '@/components/interfaces/SQLEditor/SQLEditor.types'

// Module singleton — clear any pending request before each test.
beforeEach(() => {
  sqlEditorDiffRequestState.pending = undefined
})

describe('sqlEditorDiffRequestState', () => {
  it('is empty by default', () => {
    expect(sqlEditorDiffRequestState.pending).toBeUndefined()
  })

  it('requestDiff queues a pending request', () => {
    sqlEditorDiffRequestState.requestDiff('select 1', DiffType.Addition)

    expect(sqlEditorDiffRequestState.pending).toEqual({
      sql: 'select 1',
      diffType: DiffType.Addition,
    })
  })

  it('consumeDiffRequest returns the pending request and clears it', () => {
    sqlEditorDiffRequestState.requestDiff('select 1', DiffType.Modification)

    const consumed = sqlEditorDiffRequestState.consumeDiffRequest()

    expect(consumed).toEqual({ sql: 'select 1', diffType: DiffType.Modification })
    expect(sqlEditorDiffRequestState.pending).toBeUndefined()
  })

  it('consumeDiffRequest returns undefined when nothing is pending', () => {
    expect(sqlEditorDiffRequestState.consumeDiffRequest()).toBeUndefined()
  })

  it('a later request replaces an unconsumed one (queue of one)', () => {
    sqlEditorDiffRequestState.requestDiff('select 1', DiffType.Addition)
    sqlEditorDiffRequestState.requestDiff('select 2', DiffType.Modification)

    expect(sqlEditorDiffRequestState.consumeDiffRequest()).toEqual({
      sql: 'select 2',
      diffType: DiffType.Modification,
    })
  })
})

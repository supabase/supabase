import { snapshot } from 'valtio'
import { beforeEach, describe, expect, it } from 'vitest'

import { sqlEditorSessionState } from './sql-editor-session-state'

// The session store is a module singleton, so reset its mutable fields before
// each test to keep cases independent.
beforeEach(() => {
  sqlEditorSessionState.results = {}
  sqlEditorSessionState.limit = 100
})

describe('sqlEditorSessionState', () => {
  describe('results', () => {
    it('addResult stores rows (and optional autoLimit) keyed by snippet id', () => {
      sqlEditorSessionState.addResult('a', [{ x: 1 }], 50)

      const result = sqlEditorSessionState.results['a']?.[0]
      expect(result?.rows).toEqual([{ x: 1 }])
      expect(result?.autoLimit).toBe(50)
      expect(result?.error).toBeUndefined()
    })

    it('addResultError stores the error with empty rows', () => {
      sqlEditorSessionState.addResultError('a', { message: 'boom' }, 25)

      const result = sqlEditorSessionState.results['a']?.[0]
      expect(result?.rows).toEqual([])
      expect(result?.error).toEqual({ message: 'boom' })
      expect(result?.autoLimit).toBe(25)
    })

    it('resetResult clears the rows for a snippet', () => {
      sqlEditorSessionState.addResult('a', [{ x: 1 }])
      sqlEditorSessionState.resetResult('a')

      expect(sqlEditorSessionState.results['a']).toEqual([])
    })
  })

  describe('clearForSnippet', () => {
    it('deletes results for a snippet, leaving others intact', () => {
      sqlEditorSessionState.addResult('a', [{ x: 1 }])
      sqlEditorSessionState.addResult('b', [{ y: 2 }])

      sqlEditorSessionState.clearForSnippet('a')

      expect(sqlEditorSessionState.results['a']).toBeUndefined()
      expect(sqlEditorSessionState.results['b']?.[0]?.rows).toEqual([{ y: 2 }])
    })
  })

  describe('limit', () => {
    it('defaults to 100 and is updated by setLimit', () => {
      expect(snapshot(sqlEditorSessionState).limit).toBe(100)

      sqlEditorSessionState.setLimit(500)

      expect(snapshot(sqlEditorSessionState).limit).toBe(500)
    })
  })
})

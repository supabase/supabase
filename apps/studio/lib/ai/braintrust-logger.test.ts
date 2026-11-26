import { describe, expect, it } from 'vitest'

import { hideSpanErrorFromTrace, redactHiddenSpanError } from './braintrust-logger'
import { NO_DATA_ERROR } from './tools/execute-sql-output'

describe('redactHiddenSpanError', () => {
  it('hides child errors until the hidden span ends', () => {
    hideSpanErrorFromTrace('parent')
    const childError = (span_id: string) => ({
      span_id,
      span_parents: ['parent'],
      error: 'key (email)=(a@b.c)',
    })

    for (const span_id of ['tool-1', 'tool-2']) {
      expect(redactHiddenSpanError(childError(span_id))).toEqual({
        ...childError(span_id),
        error: NO_DATA_ERROR,
      })
    }
    redactHiddenSpanError({ span_id: 'parent', metrics: { end: 1 } })
    expect(redactHiddenSpanError(childError('tool-3'))).toEqual(childError('tool-3'))
  })

  it('leaves errors on other spans alone', () => {
    hideSpanErrorFromTrace('hidden')
    const otherError = { span_id: 'other', span_parents: ['root'], error: 'boom' }

    expect(redactHiddenSpanError(otherError)).toEqual(otherError)
  })
})

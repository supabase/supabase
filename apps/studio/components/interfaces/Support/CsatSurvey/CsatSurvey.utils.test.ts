import { describe, expect, it } from 'vitest'

import { parseCsatSurveyParams } from './CsatSurvey.utils'

describe('parseCsatSurveyParams', () => {
  it('returns a valid result with the yes answer preselected', () => {
    expect(parseCsatSurveyParams({ conversation_id: 'cnv_1abc2', helpful: 'yes' })).toEqual({
      status: 'valid',
      conversationId: 'cnv_1abc2',
      initialSatisfied: true,
    })
  })

  it('returns a valid result with the no answer preselected', () => {
    expect(parseCsatSurveyParams({ conversation_id: 'cnv_1abc2', helpful: 'no' })).toEqual({
      status: 'valid',
      conversationId: 'cnv_1abc2',
      initialSatisfied: false,
    })
  })

  it('preselects yes when helpful is missing or unknown', () => {
    expect(parseCsatSurveyParams({ conversation_id: 'cnv_1abc2' })).toEqual({
      status: 'valid',
      conversationId: 'cnv_1abc2',
      initialSatisfied: true,
    })
    expect(parseCsatSurveyParams({ conversation_id: 'cnv_1abc2', helpful: 'maybe' })).toEqual({
      status: 'valid',
      conversationId: 'cnv_1abc2',
      initialSatisfied: true,
    })
  })

  it('trims whitespace around the conversation id', () => {
    expect(parseCsatSurveyParams({ conversation_id: ' cnv_1abc2 ' })).toMatchObject({
      status: 'valid',
      conversationId: 'cnv_1abc2',
    })
  })

  it.each([undefined, '', 'cnv_', 'CNV_1ABC', '1abc2', 'cnv_1abc2/extra', 'cnv_1abc2;drop'])(
    'rejects the conversation id %s',
    (conversation_id) => {
      expect(parseCsatSurveyParams({ conversation_id, helpful: 'yes' })).toEqual({
        status: 'invalid',
      })
    }
  )
})

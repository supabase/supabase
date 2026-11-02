import { describe, expect, it } from 'vitest'

import { csatSurveyParamsSchema } from './CsatSurvey.schema'

describe('parseCsatSurveyParams', () => {
  it.each([
    { helpful: 'yes', expected: true },
    { helpful: 'no', expected: false },
    { helpful: undefined, expected: true },
    { helpful: 'maybe', expected: true },
  ])('parses helpful=$helpful as $expected (defaults to yes)', ({ helpful, expected }) => {
    expect(csatSurveyParamsSchema.safeParse({ conversation_id: 'cnv_1abc2', helpful })).toEqual({
      success: true,
      data: { conversation_id: 'cnv_1abc2', helpful: expected },
    })
  })

  it('trims whitespace around the conversation id', () => {
    expect(csatSurveyParamsSchema.safeParse({ conversation_id: ' cnv_1abc2 ' })).toEqual({
      success: true,
      data: {
        conversation_id: 'cnv_1abc2',
        helpful: true,
      },
    })
  })

  it.each([undefined, '', 'cnv_', 'CNV_1ABC', '1abc2', 'cnv_1abc2/extra', 'cnv_1abc2;drop'])(
    'rejects the conversation id %s',
    (conversation_id) => {
      expect(csatSurveyParamsSchema.safeParse({ conversation_id, helpful: 'yes' })).toMatchObject({
        success: false,
      })
    }
  )
})

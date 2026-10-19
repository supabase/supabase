import { describe, expect, it } from 'vitest'

import { csatSurveyParamsSchema } from './CsatSurvey.schema'

describe('parseCsatSurveyParams', () => {
  it('returns a valid result with the yes answer preselected', () => {
    expect(
      csatSurveyParamsSchema.safeParse({ conversation_id: 'cnv_1abc2', helpful: 'yes' })
    ).toEqual({
      success: true,
      data: {
        conversation_id: 'cnv_1abc2',
        helpful: true,
      },
    })
  })

  it('returns a valid result with the no answer preselected', () => {
    expect(
      csatSurveyParamsSchema.safeParse({ conversation_id: 'cnv_1abc2', helpful: 'no' })
    ).toEqual({
      success: true,
      data: {
        conversation_id: 'cnv_1abc2',
        helpful: false,
      },
    })
  })

  it('preselects yes when helpful is missing or unknown', () => {
    expect(csatSurveyParamsSchema.safeParse({ conversation_id: 'cnv_1abc2' })).toEqual({
      success: true,
      data: {
        conversation_id: 'cnv_1abc2',
        helpful: true,
      },
    })
    expect(
      csatSurveyParamsSchema.safeParse({ conversation_id: 'cnv_1abc2', helpful: 'maybe' })
    ).toEqual({
      success: true,
      data: {
        conversation_id: 'cnv_1abc2',
        helpful: true,
      },
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

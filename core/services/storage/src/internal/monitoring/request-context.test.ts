import {
  getSbReqId,
  getSbReqIdFromPayload,
  getValidTraceparent,
  SUPABASE_REQUEST_ID_HEADER,
  TRACEPARENT_HEADER,
} from './request-context'

describe('request log context helpers', () => {
  it('extracts sbReqId values from request headers', () => {
    expect(
      getSbReqId({
        [SUPABASE_REQUEST_ID_HEADER]: ['sb-req-123', 'sb-req-456'],
      })
    ).toBe('sb-req-123')

    expect(
      getSbReqId({
        [SUPABASE_REQUEST_ID_HEADER]: [],
      })
    ).toBeUndefined()
  })

  it('extracts sbReqId values from queue payloads', () => {
    expect(
      getSbReqIdFromPayload({
        sbReqId: 'sb-req-123',
        reqId: 'trace-123',
      })
    ).toBe('sb-req-123')

    expect(
      getSbReqIdFromPayload({
        event: {
          payload: {
            sbReqId: 'sb-req-456',
            reqId: 'trace-456',
          },
        },
      })
    ).toBe('sb-req-456')

    expect(
      getSbReqIdFromPayload({
        reqId: 'trace-only',
      })
    ).toBeUndefined()
    expect(getSbReqIdFromPayload({ sbReqId: '' })).toBeUndefined()
    expect(getSbReqIdFromPayload(undefined)).toBeUndefined()
  })

  it('returns valid traceparent headers', () => {
    expect(
      getValidTraceparent({
        [TRACEPARENT_HEADER]: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
      })
    ).toBe('00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01')

    expect(
      getValidTraceparent({
        [TRACEPARENT_HEADER]:
          '01-fbf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00-future-field',
      })
    ).toBe('01-fbf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00-future-field')
  })

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['malformed', 'malformed-value'],
    [
      'multiple values',
      [
        '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
        '00-fbf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00',
      ],
    ],
    ['short trace id', '00-4bf92f3577b34da6a3ce929d0e0e47-00f067aa0ba902b7-01'],
    ['short parent id', '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902-01'],
    ['uppercase hex', '00-4BF92F3577B34DA6A3CE929D0E0E4736-00F067AA0BA902B7-01'],
    ['missing flags', '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7'],
    ['version ff', 'ff-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'],
    [
      'version 00 with extra fields',
      '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01-extra',
    ],
    ['all-zero trace id', '00-00000000000000000000000000000000-00f067aa0ba902b7-01'],
    ['all-zero parent id', '00-4bf92f3577b34da6a3ce929d0e0e4736-0000000000000000-01'],
  ])('ignores %s traceparent headers', (_name, traceparent) => {
    expect(
      getValidTraceparent({
        [TRACEPARENT_HEADER]: traceparent,
      })
    ).toBeUndefined()
  })
})

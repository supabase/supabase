import { describe, expect, it } from 'vitest'
import { getHttpStatusCodeInfo } from './http-status-codes'

describe('getHttpStatusCodeInfo', () => {
  it('should return the correct status code info', () => {
    const statusCodeInfo = getHttpStatusCodeInfo(400)
    expect(statusCodeInfo).toEqual({
      code: 400,
      name: 'BAD_REQUEST',
      message: 'The server cannot or will not process the request due to an apparent client error.',
      label: 'Bad Request',
    })
  })

  it('should return unknown for an unknown status code', () => {
    const statusCodeInfo = getHttpStatusCodeInfo(999)
    expect(statusCodeInfo).toEqual({
      code: 999,
      name: 'UNKNOWN',
      message: 'Unknown status code',
      label: 'Unknown',
    })
  })
})

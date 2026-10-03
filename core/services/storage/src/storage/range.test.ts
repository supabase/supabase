import { ErrorCode } from '@internal/errors'
import { parseCopySourceRangeHeader, parseRangeHeader } from './range'

describe('byte range parsing', () => {
  describe('parseRangeHeader', () => {
    it.each([
      ['bytes=0-0', { fromByte: 0, size: 1, toByte: 0 }],
      ['bytes=2-5', { fromByte: 2, size: 4, toByte: 5 }],
      ['bytes=7-', { fromByte: 7, size: 3, toByte: 9 }],
      ['bytes=-5', { fromByte: 5, size: 5, toByte: 9 }],
      ['bytes=8-99', { fromByte: 8, size: 2, toByte: 9 }],
      ['bytes=9-9', { fromByte: 9, size: 1, toByte: 9 }],
      ['bytes=0-9', { fromByte: 0, size: 10, toByte: 9 }],
      ['bytes=-99', { fromByte: 0, size: 10, toByte: 9 }],
    ])('parses %s', (range, expected) => {
      expect(parseRangeHeader(range, 10)).toEqual(expected)
    })

    it.each([
      'bytes=-0',
      'bytes=10-12',
      'bytes=8-4',
      'bytes=-',
      'bytes=a-b',
      'items=0-1',
    ])('rejects invalid range %s', (range) => {
      expectInvalidRange(() => parseRangeHeader(range, 10), 416)
    })
  })

  describe('parseCopySourceRangeHeader', () => {
    it.each([
      ['bytes=0-0', { fromByte: 0, size: 1, toByte: 0 }],
      ['bytes=2-5', { fromByte: 2, size: 4, toByte: 5 }],
      ['bytes=9-9', { fromByte: 9, size: 1, toByte: 9 }],
      ['bytes=0-9', { fromByte: 0, size: 10, toByte: 9 }],
    ])('parses inclusive explicit copy source range %s', (range, expected) => {
      expect(parseCopySourceRangeHeader(range, 10)).toEqual(expected)
    })

    it.each([
      'bytes=-5',
      'bytes=7-',
      'bytes=10-12',
      'bytes=8-4',
      'bytes=a-b',
      'items=0-1',
    ])('rejects invalid copy source range %s', (range) => {
      expectInvalidRange(() => parseCopySourceRangeHeader(range, 10), 400)
    })
  })
})

function expectInvalidRange(fn: () => unknown, statusCode: number) {
  try {
    fn()
  } catch (error) {
    expect(error).toMatchObject({
      code: ErrorCode.InvalidRange,
      error: 'invalid_range',
      httpStatusCode: statusCode,
      userStatusCode: statusCode,
      message: 'invalid range provided',
    })
    return
  }

  throw new Error('expected invalid range error')
}

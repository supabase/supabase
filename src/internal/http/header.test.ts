import {
  hasInvalidHeaderValueChars,
  isValidHeader,
  MAX_HEADER_NAME_LENGTH,
  MAX_HEADER_VALUE_LENGTH,
} from './header'

describe('hasInvalidHeaderValueChars', () => {
  it.each([
    ['empty value', ''],
    ['visible ASCII', 'width:100,height:200,resize:cover'],
    ['horizontal tab', 'value\twith\ttabs'],
    ['obs-text upper byte range', `value${String.fromCharCode(0x80)}${String.fromCharCode(0xff)}`],
  ])('allows %s', (_name, value) => {
    expect(hasInvalidHeaderValueChars(value)).toBe(false)
  })

  it.each([
    ['NUL', '\x00'],
    ['unit separator', '\x1f'],
    ['line feed', '\n'],
    ['carriage return', '\r'],
    ['DEL', '\x7f'],
    ['code point above one byte', '\u0100'],
  ])('rejects %s', (_name, value) => {
    expect(hasInvalidHeaderValueChars(`value${value}`)).toBe(true)
  })
})

describe('isValidHeader', () => {
  it('accepts a typical header name and value', () => {
    expect(isValidHeader('content-type', 'application/json')).toBe(true)
  })

  it('accepts an empty header value', () => {
    expect(isValidHeader('x-custom', '')).toBe(true)
  })

  it('accepts all token chars permitted by RFC7230 section 3.2.6', () => {
    expect(isValidHeader("!#$%&'*+-.^_`|~09AZaz", 'v')).toBe(true)
  })

  it('rejects header names containing characters outside the token set', () => {
    expect(isValidHeader('bad name', 'v')).toBe(false)
    expect(isValidHeader('bad:name', 'v')).toBe(false)
    expect(isValidHeader('bad(name)', 'v')).toBe(false)
    expect(isValidHeader('badåname', 'v')).toBe(false)
  })

  it('rejects an empty header name', () => {
    expect(isValidHeader('', 'v')).toBe(false)
  })

  it('rejects header names exceeding the max length', () => {
    const oversizedName = 'a'.repeat(MAX_HEADER_NAME_LENGTH + 1)
    expect(isValidHeader(oversizedName, 'value')).toBe(false)
  })

  it('accepts header names exactly at the max length', () => {
    const maxName = 'a'.repeat(MAX_HEADER_NAME_LENGTH)
    expect(isValidHeader(maxName, 'value')).toBe(true)
  })

  it('rejects header values containing control characters', () => {
    expect(isValidHeader('x-custom', 'bad\x00value')).toBe(false)
    expect(isValidHeader('x-custom', 'bad\nvalue')).toBe(false)
  })

  it('rejects header values containing CRLF', () => {
    expect(isValidHeader('x-custom', 'innocent\r\nX-Injected: 1')).toBe(false)
  })

  it('rejects header values exceeding the max byte length', () => {
    const oversizedValue = 'a'.repeat(MAX_HEADER_VALUE_LENGTH + 1)
    expect(isValidHeader('x-custom', oversizedValue)).toBe(false)
  })

  it('accepts header values exactly at the max byte length', () => {
    const maxValue = 'a'.repeat(MAX_HEADER_VALUE_LENGTH)
    expect(isValidHeader('x-custom', maxValue)).toBe(true)
  })

  it('counts obs-text values by UTF-8 byte length', () => {
    expect(isValidHeader('x-custom', String.fromCharCode(0x80).repeat(4096))).toBe(true)
    expect(isValidHeader('x-custom', String.fromCharCode(0x80).repeat(4097))).toBe(false)
  })

  it('accepts an array of values when all are valid', () => {
    expect(isValidHeader('x-custom', ['one', 'two', 'three'])).toBe(true)
  })

  it('rejects an array of values when any are invalid', () => {
    expect(isValidHeader('x-custom', ['ok', 'bad\x00value'])).toBe(false)
  })
})

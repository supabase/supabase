import { ErrorCode } from '@internal/errors'
import { validateMimeType } from './mime-type'

describe('validateMimeType', () => {
  it.each([
    ['image/png', 'image/png'],
    ['image/png', 'image/*'],
    ['Text/Plain;charset=UTF-8', 'text/plain'],
    ['text/plain', 'TEXT/PLAIN'],
    ['Image/PNG', 'IMAGE/*'],
    ['text/plain;charset=UTF-8', 'text/plain'],
    ['application/json; charset=utf-8', 'application/json'],
    ['text/plain;charset=UTF-8', 'text/*'],
    ['text/plain', 'text/plain;charset=UTF-8'],
    ['Text/Plain;charset=iso-8859-1', 'TEXT/PLAIN;charset=UTF-8'],
    ['text/plain; charset=UTF-8', '\tTEXT/*; note="a,b;c"\t'],
    [
      "application/vnd.example_type+json; x!#$%&'*+.^_`|~=value",
      'application/vnd.example_type+json',
    ],
    ['\tText/Plain\t; charset="UTF-8"; note="a,b;c/d\\"e\\\\f"\t', 'text/plain'],
    ['text/plain;; charset=UTF-8;', 'text/*'],
  ])('accepts %j with rule %j', (mimeType, allowedMimeType) => {
    expect(validateMimeType(mimeType, [allowedMimeType])).toBe(true)
  })

  it('skips malformed stored restrictions without broadening their match', () => {
    const invalidRules = ['garbage*', '*/*', '*/png', 'image/p*', 'image/png/extra']
    expect(() => validateMimeType('image/png', invalidRules)).toThrow(
      expect.objectContaining({ code: ErrorCode.InvalidMimeType })
    )
    expect(validateMimeType('image/png', [...invalidRules, 'image/png'])).toBe(true)
  })

  it.each([
    'text/plain;foo',
    'text/plain;foo=x, application/pdf',
    'text/plain;note="unterminated',
    'text/*;note="ok"junk',
    'text/plain;note="\u011f"',
    '\rtext/plain',
    'text/plain\n',
    '\u00a0text/plain',
  ])('rejects malformed matching rule %j and still considers later rules', (rule) => {
    expect(() => validateMimeType('text/plain', [rule])).toThrow(
      expect.objectContaining({ code: ErrorCode.InvalidMimeType })
    )
    expect(validateMimeType('text/plain', [rule, 'text/plain'])).toBe(true)
  })

  it('still rejects a media type that is not allowed', () => {
    expect(() => validateMimeType('image/png;foo=bar', ['image/jpeg'])).toThrow(
      expect.objectContaining({ code: ErrorCode.InvalidMimeType })
    )
  })

  it('rejects a malformed media type', () => {
    expect(() => validateMimeType('notamediatype', ['text/plain'])).toThrow(
      expect.objectContaining({ code: ErrorCode.InvalidMimeType })
    )
  })

  it.each([
    'image/png/extra',
    'image/png;foo=x, application/pdf',
    'image/png;foo',
    'image/png;foo="unterminated',
    'image/png;foo="ok"junk',
    'image/png;foo=bar baz',
    'image/png;foo="bad\u0000value"',
    'image/png;foo="bad\u007fvalue"',
    'image/png\n',
    'image/png;\r\nfoo=bar',
    'image/',
    'image/*',
  ])('rejects the complete malformed or wildcard content type %j', (value) => {
    expect(() => validateMimeType(value, ['image/*'])).toThrow(
      expect.objectContaining({ code: ErrorCode.InvalidMimeType })
    )
  })
})

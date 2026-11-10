import { describe, expect, it } from 'vitest'

import { unescapeNewlines } from './AuthProvidersForm.utils'

describe('unescapeNewlines', () => {
  it('converts a literal \\n escape sequence to a real newline', () => {
    expect(unescapeNewlines('Your code is {{ .Code }}\\n@example.com #{{ .Code }}')).toEqual(
      'Your code is {{ .Code }}\n@example.com #{{ .Code }}'
    )
  })

  it('converts multiple literal \\n escape sequences', () => {
    expect(unescapeNewlines('Line one\\nLine two\\nLine three')).toEqual(
      'Line one\nLine two\nLine three'
    )
  })

  it('leaves real newlines unchanged', () => {
    expect(unescapeNewlines('Line one\nLine two')).toEqual('Line one\nLine two')
  })

  it('leaves a string without escape sequences unchanged', () => {
    expect(unescapeNewlines('Your code is {{ .Code }}')).toEqual('Your code is {{ .Code }}')
  })

  it('returns an empty string unchanged', () => {
    expect(unescapeNewlines('')).toEqual('')
  })

  it('leaves a backslash not followed by n unchanged', () => {
    expect(unescapeNewlines('C:\\path\\to\\file')).toEqual('C:\\path\\to\\file')
  })

  it('converts a string that is only a literal \\n', () => {
    expect(unescapeNewlines('\\n')).toEqual('\n')
  })
})

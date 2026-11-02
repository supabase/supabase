import { describe, expect, it } from 'vitest'

import {
  isWebOtpCompliantMessage,
  normalizeSmsTemplate,
  renderSmsOtpTemplate,
} from './sms-template'

describe('normalizeSmsTemplate', () => {
  it('leaves templates without newlines unchanged', () => {
    expect(normalizeSmsTemplate('Your code is {{ .Code }}')).toBe('Your code is {{ .Code }}')
  })

  it('preserves real newlines', () => {
    expect(normalizeSmsTemplate('Your code is {{ .Code }}\n@mysite.com')).toBe(
      'Your code is {{ .Code }}\n@mysite.com'
    )
  })

  it('normalizes CRLF and CR to LF', () => {
    expect(normalizeSmsTemplate('a\r\nb')).toBe('a\nb')
    expect(normalizeSmsTemplate('a\rb')).toBe('a\nb')
  })

  it('converts backslash-n escapes to a real newline', () => {
    expect(normalizeSmsTemplate('Your code is {{ .Code }}\\n@mysite.com')).toBe(
      'Your code is {{ .Code }}\n@mysite.com'
    )
  })

  it('converts backslash-r-n escapes to a real newline', () => {
    expect(normalizeSmsTemplate('Your code is {{ .Code }}\\r\\n@mysite.com')).toBe(
      'Your code is {{ .Code }}\n@mysite.com'
    )
  })
})

describe('renderSmsOtpTemplate', () => {
  it('substitutes the code in a template without newlines', () => {
    expect(renderSmsOtpTemplate('Your code is {{ .Code }}', '123456')).toBe(
      'Your code is 123456'
    )
  })

  it('yields a real newline from a literal newline in the template', () => {
    const body = renderSmsOtpTemplate('Your code is {{ .Code }}\n@mysite.com', '123456')
    expect(body).toBe('Your code is 123456\n@mysite.com')
    expect(body).toContain('\n')
  })

  it('yields a real newline from a backslash-n escape in the template', () => {
    const body = renderSmsOtpTemplate('Your code is {{ .Code }}\\n@mysite.com', '123456')
    expect(body).toBe('Your code is 123456\n@mysite.com')
    expect(body).toContain('\n')
  })

  it('supports code placeholders with varied spacing', () => {
    expect(renderSmsOtpTemplate('Code:{{.Code}}', '999')).toBe('Code:999')
    expect(renderSmsOtpTemplate('Code:{{  .Code  }}', '999')).toBe('Code:999')
  })
})

describe('isWebOtpCompliantMessage', () => {
  it('requires at least one newline', () => {
    expect(isWebOtpCompliantMessage('Your code is 123456')).toBe(false)
    expect(isWebOtpCompliantMessage('Your code is 123456\n@mysite.com')).toBe(true)
  })
})

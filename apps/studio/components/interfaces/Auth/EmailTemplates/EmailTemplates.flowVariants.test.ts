import { describe, expect, it } from 'vitest'

import { getTemplateFlowVariant, supportsTemplateFlowPicker } from './EmailTemplates.flowVariants'

describe('EmailTemplates.flowVariants', () => {
  it('supports flow picker on the four auth templates only', () => {
    expect(supportsTemplateFlowPicker('CONFIRMATION')).toBe(true)
    expect(supportsTemplateFlowPicker('MAGIC_LINK')).toBe(true)
    expect(supportsTemplateFlowPicker('RECOVERY')).toBe(true)
    expect(supportsTemplateFlowPicker('EMAIL_CHANGE')).toBe(true)
    expect(supportsTemplateFlowPicker('INVITE')).toBe(false)
    expect(supportsTemplateFlowPicker('REAUTHENTICATION')).toBe(false)
  })

  it('returns link, otp, and both variants for magic link', () => {
    const link = getTemplateFlowVariant('MAGIC_LINK', 'link')
    const otp = getTemplateFlowVariant('MAGIC_LINK', 'otp')
    const both = getTemplateFlowVariant('MAGIC_LINK', 'both')

    expect(link.subject).toBe('Your sign-in link')
    expect(link.body).toContain('{{ .ConfirmationURL }}')
    expect(link.body).not.toContain('{{ .Token }}')

    expect(otp.subject).toBe('{{ .Token }} is your sign-in code')
    expect(otp.body).toContain('{{ .Token }}')
    expect(otp.body).not.toContain('{{ .ConfirmationURL }}')

    expect(both.body).toContain('{{ .ConfirmationURL }}')
    expect(both.body).toContain('Alternatively, enter this code: {{ .Token }}')
  })
})

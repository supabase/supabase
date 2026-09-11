import { describe, expect, it } from 'vitest'

import {
  getConfirmLabelText,
  getConfirmPlaceholderFromAction,
  getConfirmStringFromAction,
} from './confirm-actions'

describe('confirm-actions', () => {
  it('resolves preset confirmation strings', () => {
    expect(getConfirmStringFromAction('delete')).toBe('DELETE')
    expect(getConfirmStringFromAction('purge')).toBe('PURGE')
    expect(getConfirmStringFromAction('revoke')).toBe('REVOKE')
    expect(getConfirmStringFromAction('disable')).toBe('DISABLE')
    expect(getConfirmStringFromAction('re-enable')).toBe('RE-ENABLE')
    expect(getConfirmStringFromAction('proceed')).toBe('PROCEED')
  })

  it('falls back to custom confirmation strings', () => {
    expect(getConfirmStringFromAction('custom', 'user@example.com')).toBe('user@example.com')
    expect(getConfirmStringFromAction(undefined, 'branch-name')).toBe('branch-name')
  })

  it('resolves preset placeholders', () => {
    expect(getConfirmPlaceholderFromAction('delete')).toBe('DELETE')
    expect(getConfirmPlaceholderFromAction('custom', 'Enter your email')).toBe('Enter your email')
  })

  it('builds contextual label copy for preset actions', () => {
    expect(getConfirmLabelText('DELETE', 'delete', 'this organization')).toBe(
      'Type DELETE to delete this organization.'
    )
    expect(getConfirmLabelText('PURGE', 'purge', 'this queue')).toBe(
      'Type PURGE to purge this queue.'
    )
    expect(getConfirmLabelText('REVOKE', 'revoke', 'this signing key')).toBe(
      'Type REVOKE to revoke this signing key.'
    )
  })

  it('builds generic label copy for custom actions', () => {
    expect(getConfirmLabelText('user@example.com', 'custom')).toBe(
      'Type user@example.com to confirm.'
    )
  })
})

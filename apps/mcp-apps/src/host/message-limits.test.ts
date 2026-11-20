import { describe, expect, it } from 'vitest'

import { claudeMessageBlocks, tidyMessageText } from './message-limits'

describe('messages a view sends to Claude', () => {
  it('collapses the runs of blank lines and spaces Claude refuses, as log lines have', () => {
    expect(tidyMessageText('a\n\n\n\n\n\nb')).toBe('a\n\n\nb')
    expect(tidyMessageText(`a${' '.repeat(200)}b`)).toBe(`a${' '.repeat(64)}b`)
    // Ordinary formatting is left alone.
    expect(tidyMessageText('a\n\nb    c')).toBe('a\n\nb    c')
  })

  it('drops blank blocks, which Claude refuses', () => {
    expect(claudeMessageBlocks(['Investigate these logs', '   '])).toEqual([
      'Investigate these logs',
    ])
  })

  it('asks the user to send less rather than cut what they selected', () => {
    // 8,000 characters across all blocks, plus one for each block after the first.
    expect(claudeMessageBlocks(['a'.repeat(4000), 'b'.repeat(3999)])).toHaveLength(2)
    expect(() => claudeMessageBlocks(['a'.repeat(4000), 'b'.repeat(4000)])).toThrow(
      'Claude accepts messages of up to 8,000 characters, and this one has 8,001. Select less to send.'
    )
  })
})

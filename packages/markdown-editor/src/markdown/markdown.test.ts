import { describe, expect, it } from 'vitest'

import { exportMarkdown } from './export'
import { importMarkdown } from './import'

describe('Markdown round-trips', () => {
  it.each([
    '**bold *italic* bold**',
    '*italic **bold** italic*',
    '**before [link](https://example.com) after**',
    '[before **bold** after](https://example.com)',
    '***both*** *italic*',
    '**bold *both*** *italic*',
    '**before `code` after**',
    '**first\nsecond**',
    '> Quote\n>\n> - First\n> - Second',
    '```sql\nselect 1\n```',
    '| a | b |\n| - | - |\n| c | d |',
    '- [ ] Task\n- [x] Done',
    '[reference][id]\n\n[id]: https://example.com',
  ])('preserves content and valid marks: %s', (source) => {
    const original = importMarkdown(source)
    let serialized = exportMarkdown(original)
    for (let cycle = 0; cycle < 3; cycle++) {
      const restored = importMarkdown(serialized)
      expect(() => restored.check()).not.toThrow()
      expect(restored.eq(original)).toBe(true)
      expect(exportMarkdown(restored)).toBe(serialized)
      serialized = exportMarkdown(restored)
    }
  })

  it('deduplicates redundant nested marks in existing Markdown', () => {
    const document = importMarkdown('**bold *****italic***** bold**')
    expect(() => document.check()).not.toThrow()
    expect(exportMarkdown(document)).toBe('**bold *italic* bold**')
  })
})

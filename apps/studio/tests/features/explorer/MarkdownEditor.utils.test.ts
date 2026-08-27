import { describe, expect, it } from 'vitest'

import {
  getCodeBlockLanguage,
  getCodeEditorLanguage,
} from '@/components/interfaces/Explorer/MarkdownEditor.utils'

describe('getCodeBlockLanguage', () => {
  it.each([
    [undefined, 'text'],
    ['', 'text'],
    ['text', 'text'],
    ['plaintext', 'text'],
    ['txt', 'text'],
    ['sql', 'sql'],
    ['pgsql', 'sql'],
    ['javascript', 'javascript'],
    ['js', 'javascript'],
    ['JS', 'javascript'],
    ['typescript', 'typescript'],
    ['ts', 'typescript'],
    ['json', 'json'],
    ['html', 'html'],
    ['css', 'css'],
    ['markdown', 'markdown'],
    ['md', 'markdown'],
    ['python', 'python'],
  ])('normalizes %s to %s', (language, expected) => {
    expect(getCodeBlockLanguage(language)).toBe(expected)
  })
})

describe('getCodeEditorLanguage', () => {
  it.each([
    [undefined, 'plaintext'],
    ['', 'plaintext'],
    ['text', 'plaintext'],
    ['txt', 'plaintext'],
    ['bash', 'plaintext'],
    ['unknown', 'plaintext'],
    ['sql', 'pgsql'],
    ['pgsql', 'pgsql'],
    ['javascript', 'javascript'],
    ['js', 'javascript'],
    ['JS', 'javascript'],
    ['typescript', 'typescript'],
    ['ts', 'typescript'],
    ['json', 'json'],
    ['html', 'html'],
    ['css', 'css'],
    ['markdown', 'markdown'],
    ['md', 'markdown'],
  ])('maps %s to %s', (language, expected) => {
    expect(getCodeEditorLanguage(language)).toBe(expected)
  })
})

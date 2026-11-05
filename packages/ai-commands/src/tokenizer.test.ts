import { describe, expect, test } from 'vitest'

import { getChatRequestTokenCount, getMaxTokenCount, getMessageTokenCount } from './tokenizer'

const MODEL = 'gpt-6-luna'

describe('tokenizer', () => {
  test('defaults to the GPT-6 model id', () => {
    const messages = [{ role: 'user' as const, content: 'select 1' }]

    expect(getChatRequestTokenCount(messages)).toBe(getChatRequestTokenCount(messages, MODEL))
    expect(getMessageTokenCount(messages[0])).toBe(getMessageTokenCount(messages[0], MODEL))
  })

  test('reports the GPT-6 context window', () => {
    expect(getMaxTokenCount(MODEL)).toBe(1_050_000)
  })
})

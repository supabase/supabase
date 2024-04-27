import { describe, expect, test } from '@jest/globals'
import { Message, tokenizeChat } from './tokenizer'

const sampleMessages: Message[] = [
  { role: 'system', content: 'You are a helpful Postgres SQL assistant' },
  { role: 'user', content: 'Help me write SQL to get all movies that start with T' },
  {
    role: 'assistant',
    content: "Sure!\n```sql\nselect * from movies where title like 'T%';\n```",
  },
  { role: 'user', content: 'Thanks! What about S?' },
]

describe('tokenizer', () => {
  test('counts llama3 tokens correctly', async () => {
    const tokens = await tokenizeChat(sampleMessages, 'llama3')
    expect(tokens.length).toBe(68)
  })

  test('counts gpt-3.5-turbo tokens correctly', async () => {
    const tokens = await tokenizeChat(sampleMessages, 'gpt-3.5-turbo')
    expect(tokens.length).toBe(66)
  })
})

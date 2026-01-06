import { describe, it, expect } from 'vitest'
import { getDefaultModelForProvider } from './model.utils'

describe('getDefaultModelForProvider', () => {
  it('should return default model for bedrock provider', () => {
    const result = getDefaultModelForProvider('bedrock')

    expect(result).toBe('openai.gpt-oss-120b-1:0')
  })

  it('should return default model for openai provider', () => {
    const result = getDefaultModelForProvider('openai')

    expect(result).toBe('gpt-5-mini')
  })

  it('should return default model for anthropic provider', () => {
    const result = getDefaultModelForProvider('anthropic')

    expect(result).toBe('claude-3-5-haiku-20241022')
  })

  it('should return undefined for invalid provider', () => {
    const result = getDefaultModelForProvider('invalid' as any)

    expect(result).toBeUndefined()
  })
})

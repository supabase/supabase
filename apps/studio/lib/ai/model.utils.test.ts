import { describe, expect, it } from 'vitest'

import { getDefaultModelForProvider, PROVIDERS } from './model.utils'
import type { ProviderName } from './model.utils'

describe('model.utils', () => {
  describe('getDefaultModelForProvider', () => {
    it('should return correct default for bedrock provider', () => {
      const result = getDefaultModelForProvider('bedrock')
      expect(result).toBe('openai.gpt-oss-120b-1:0')
    })

    it('should return correct default for openai provider', () => {
      const result = getDefaultModelForProvider('openai')
      expect(result).toBe('gpt-5-mini')
    })

    it('should return correct default for anthropic provider', () => {
      const result = getDefaultModelForProvider('anthropic')
      expect(result).toBe('claude-3-5-haiku-20241022')
    })

    it('should return undefined for unknown provider', () => {
      const result = getDefaultModelForProvider('unknown' as ProviderName)
      expect(result).toBeUndefined()
    })
  })

  describe('PROVIDERS registry', () => {
    it('should have bedrock provider with models', () => {
      expect(PROVIDERS.bedrock).toBeDefined()
      expect(PROVIDERS.bedrock.models).toBeDefined()
      expect(Object.keys(PROVIDERS.bedrock.models)).toContain(
        'anthropic.claude-3-7-sonnet-20250219-v1:0'
      )
      expect(Object.keys(PROVIDERS.bedrock.models)).toContain('openai.gpt-oss-120b-1:0')
    })

    it('should have openai provider with models', () => {
      expect(PROVIDERS.openai).toBeDefined()
      expect(PROVIDERS.openai.models).toBeDefined()
      expect(Object.keys(PROVIDERS.openai.models)).toContain('gpt-5')
      expect(Object.keys(PROVIDERS.openai.models)).toContain('gpt-5-mini')
    })

    it('should have anthropic provider with models', () => {
      expect(PROVIDERS.anthropic).toBeDefined()
      expect(PROVIDERS.anthropic.models).toBeDefined()
      expect(Object.keys(PROVIDERS.anthropic.models)).toContain('claude-sonnet-4-20250514')
      expect(Object.keys(PROVIDERS.anthropic.models)).toContain('claude-3-5-haiku-20241022')
    })

    it('should have exactly one default model per provider', () => {
      const providers: ProviderName[] = ['bedrock', 'openai', 'anthropic']

      providers.forEach((provider) => {
        const models = PROVIDERS[provider].models
        const defaultModels = Object.entries(models).filter(([_, config]) => config.default)
        expect(defaultModels.length).toBe(1)
      })
    })

    it('should have valid model configurations', () => {
      const providers: ProviderName[] = ['bedrock', 'openai', 'anthropic']

      providers.forEach((provider) => {
        const models = PROVIDERS[provider].models
        Object.entries(models).forEach(([modelId, config]) => {
          expect(config).toHaveProperty('default')
          expect(typeof config.default).toBe('boolean')
        })
      })
    })

    it('should have bedrock model with promptProviderOptions', () => {
      const sonnetModel = PROVIDERS.bedrock.models['anthropic.claude-3-7-sonnet-20250219-v1:0']
      expect(sonnetModel.promptProviderOptions).toBeDefined()
      expect(sonnetModel.promptProviderOptions?.bedrock).toBeDefined()
      expect(sonnetModel.promptProviderOptions?.bedrock?.cachePoint).toEqual({ type: 'default' })
    })

    it('should have openai provider with providerOptions', () => {
      expect(PROVIDERS.openai.providerOptions).toBeDefined()
      expect(PROVIDERS.openai.providerOptions?.openai).toBeDefined()
      expect(PROVIDERS.openai.providerOptions?.openai?.reasoningEffort).toBe('minimal')
    })
  })
})

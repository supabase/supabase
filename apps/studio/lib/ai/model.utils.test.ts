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
      expect(result).toBe('gpt-6-luna')
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
      expect(Object.keys(PROVIDERS.openai.models)).toEqual(['gpt-6-luna'])
    })

    it('should have exactly one default model per provider', () => {
      const providers: ProviderName[] = ['bedrock', 'openai']

      providers.forEach((provider) => {
        const models = PROVIDERS[provider].models
        const defaultModels = Object.entries(models).filter(([_, config]) => config.default)
        expect(defaultModels.length).toBe(1)
      })
    })

    it('should have valid model configurations', () => {
      const providers: ProviderName[] = ['bedrock', 'openai']

      providers.forEach((provider) => {
        const models = PROVIDERS[provider].models
        Object.entries(models).forEach(([_modelId, config]) => {
          expect(config).toHaveProperty('default')
          expect(typeof config.default).toBe('boolean')
        })
      })
    })

    it('should have bedrock model with systemProviderOptions', () => {
      const sonnetModel = PROVIDERS.bedrock.models['anthropic.claude-3-7-sonnet-20250219-v1:0']
      expect(sonnetModel.systemProviderOptions).toBeDefined()
      expect(sonnetModel.systemProviderOptions?.bedrock).toBeDefined()
      expect(sonnetModel.systemProviderOptions?.bedrock?.cachePoint).toEqual({
        type: 'default',
      })
    })

    it('should have openai provider with providerOptions', () => {
      expect(PROVIDERS.openai.providerOptions).toBeDefined()
      expect(PROVIDERS.openai.providerOptions?.openai).toBeDefined()
      expect(PROVIDERS.openai.providerOptions?.openai?.reasoningEffort).toBeUndefined()
    })
  })
})

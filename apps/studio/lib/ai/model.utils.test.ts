import { describe, expect, it } from 'vitest'

import {
  ASSISTANT_MODELS,
  DEFAULT_ASSISTANT_ADVANCE_MODEL_ID,
  DEFAULT_ASSISTANT_BASE_MODEL_ID,
  DEFAULT_COMPLETION_MODEL,
  defaultAssistantModelId,
  getAssistantModelEntry,
  getDefaultModelForProvider,
  isAdvanceOnlyModelId,
  isAssistantBaseModelId,
  isKnownAssistantModelId,
  openaiModelEntry,
  PROVIDERS,
} from './model.utils'
import type { ProviderName } from './model.utils'

describe('model.utils', () => {
  describe('getDefaultModelForProvider', () => {
    it('should return correct default for bedrock provider', () => {
      const result = getDefaultModelForProvider('bedrock')
      expect(result).toBe('openai.gpt-oss-120b-1:0')
    })

    it('should return correct default for openai provider', () => {
      const result = getDefaultModelForProvider('openai')
      expect(result).toBe('gpt-5.4-nano')
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
      expect(Object.keys(PROVIDERS.openai.models)).toContain('gpt-5.3-codex')
      expect(Object.keys(PROVIDERS.openai.models)).toContain('gpt-5.4-nano')
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

    it('should have bedrock model with promptProviderOptions', () => {
      const sonnetModel = PROVIDERS.bedrock.models['anthropic.claude-3-7-sonnet-20250219-v1:0']
      expect(sonnetModel.promptProviderOptions).toBeDefined()
      expect(sonnetModel.promptProviderOptions?.bedrock).toBeDefined()
      expect(sonnetModel.promptProviderOptions?.bedrock?.cachePoint).toEqual({
        type: 'default',
      })
    })

    it('should have openai provider with providerOptions', () => {
      expect(PROVIDERS.openai.providerOptions).toBeDefined()
      expect(PROVIDERS.openai.providerOptions?.openai).toBeDefined()
      expect(PROVIDERS.openai.providerOptions?.openai?.reasoningEffort).toBeUndefined()
    })
  })

  describe('assistant model registry', () => {
    it('should have non-empty base and advance tiers', () => {
      expect(
        ASSISTANT_MODELS.filter((m) => !m.requiresAdvanceModelEntitlement).length
      ).toBeGreaterThan(0)
      expect(
        ASSISTANT_MODELS.filter((m) => m.requiresAdvanceModelEntitlement).length
      ).toBeGreaterThan(0)
    })

    it('all model IDs should be unique', () => {
      const ids = ASSISTANT_MODELS.map((m) => m.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('should have all models in openai provider registry', () => {
      ASSISTANT_MODELS.forEach((entry) => {
        expect(Object.keys(PROVIDERS.openai.models)).toContain(entry.id)
      })
    })

    it('defaults should satisfy unions', () => {
      expect(DEFAULT_ASSISTANT_BASE_MODEL_ID).toBe('gpt-5.4-nano')
      expect(DEFAULT_ASSISTANT_ADVANCE_MODEL_ID).toBe('gpt-5.3-codex')
      expect(defaultAssistantModelId(false)).toBe(DEFAULT_ASSISTANT_BASE_MODEL_ID)
      expect(defaultAssistantModelId(true)).toBe(DEFAULT_ASSISTANT_ADVANCE_MODEL_ID)
    })

    it('isAssistantBaseModelId / isAdvanceOnlyModelId', () => {
      expect(isAssistantBaseModelId('gpt-5.4-nano')).toBe(true)
      expect(isAssistantBaseModelId('gpt-5.3-codex')).toBe(false)
      expect(isAdvanceOnlyModelId('gpt-5.3-codex')).toBe(true)
      expect(isAdvanceOnlyModelId('gpt-5.4-nano')).toBe(false)
    })

    it('isKnownAssistantModelId', () => {
      expect(isKnownAssistantModelId('gpt-5.4-nano')).toBe(true)
      expect(isKnownAssistantModelId('gpt-5.3-codex')).toBe(true)
      expect(isKnownAssistantModelId('gpt-5')).toBe(false)
      expect(isKnownAssistantModelId('gpt-5-mini')).toBe(false)
      expect(isKnownAssistantModelId('unknown')).toBe(false)
    })

    it('getAssistantModelEntry returns config for known ids', () => {
      expect(getAssistantModelEntry('gpt-5.4-nano').reasoningEffort).toBe('low')
      expect(getAssistantModelEntry('gpt-5.3-codex').reasoningEffort).toBe('low')
      expect(getAssistantModelEntry('gpt-5.4-nano')).toEqual(
        ASSISTANT_MODELS.find((m) => m.id === 'gpt-5.4-nano')
      )
    })

    it('DEFAULT_COMPLETION_MODEL is gpt-5.4-nano with no reasoning effort', () => {
      expect(DEFAULT_COMPLETION_MODEL.id).toBe(DEFAULT_ASSISTANT_BASE_MODEL_ID)
      expect(DEFAULT_COMPLETION_MODEL.reasoningEffort).toBe('none')
    })

    it('openaiModelEntry enforces valid reasoning effort at compile time', () => {
      // Valid: supported effort level
      const withEffort = openaiModelEntry({
        id: 'gpt-5.4-nano',
        reasoningEffort: 'low',
      })
      expect(withEffort.reasoningEffort).toBe('low')

      // Valid: no effort
      const withoutEffort = openaiModelEntry({ id: 'gpt-5.4-nano' })
      expect(withoutEffort.reasoningEffort).toBeUndefined()
    })
  })
})

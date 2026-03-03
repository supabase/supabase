export type ProviderName = 'bedrock' | 'openai' | 'anthropic'

export type BedrockModel = 'anthropic.claude-3-7-sonnet-20250219-v1:0' | 'openai.gpt-oss-120b-1:0'

export type OpenAIModel = 'gpt-5' | 'gpt-5-mini'

export type AnthropicModel = 'claude-sonnet-4-20250514' | 'claude-3-5-haiku-20241022'

export type Model = BedrockModel | OpenAIModel | AnthropicModel

export type ProviderModelConfig = {
  /** Optional providerOptions to attach to the system message for this model */
  promptProviderOptions?: Record<string, any>
  /** The default model for this provider (used when limited or no preferred specified) */
  default: boolean
}

export type ProviderRegistry = {
  bedrock: {
    models: Record<BedrockModel, ProviderModelConfig>
    providerOptions?: Record<string, any>
  }
  openai: {
    models: Record<OpenAIModel, ProviderModelConfig>
    providerOptions?: Record<string, any>
  }
  anthropic: {
    models: Record<AnthropicModel, ProviderModelConfig>
    providerOptions?: Record<string, any>
  }
}

export const PROVIDERS: ProviderRegistry = {
  bedrock: {
    models: {
      'anthropic.claude-3-7-sonnet-20250219-v1:0': {
        promptProviderOptions: {
          bedrock: {
            // Always cache the system prompt (must not contain dynamic content)
            cachePoint: { type: 'default' },
          },
        },
        default: false,
      },
      'openai.gpt-oss-120b-1:0': {
        default: true,
      },
    },
  },
  openai: {
    models: {
      'gpt-5': { default: false },
      'gpt-5-mini': { default: true },
    },
    providerOptions: {
      openai: {
        reasoningEffort: 'minimal',
      },
    },
  },
  anthropic: {
    models: {
      'claude-sonnet-4-20250514': { default: false },
      'claude-3-5-haiku-20241022': { default: true },
    },
  },
}

export function getDefaultModelForProvider(provider: ProviderName): Model | undefined {
  const models = PROVIDERS[provider]?.models as Record<Model, ProviderModelConfig>
  if (!models) return undefined

  return Object.keys(models).find((id) => models[id as Model]?.default) as Model | undefined
}

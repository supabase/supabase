export type ProviderName = 'bedrock' | 'openai'

export type BedrockModel = 'anthropic.claude-3-7-sonnet-20250219-v1:0' | 'openai.gpt-oss-120b-1:0'

export type OpenAIModelId = 'gpt-6-luna'

export type OpenAIModelEntry = {
  id: OpenAIModelId
  // https://developers.openai.com/api/docs/models/gpt-6-luna
  reasoningEffort?: 'none' | 'low' | 'medium' | 'high' | 'xhigh' | 'max'
}

export const DEFAULT_COMPLETION_MODEL: OpenAIModelEntry = {
  id: 'gpt-6-luna',
  reasoningEffort: 'none',
}

export const LOGS_REWRITE_MODEL: OpenAIModelEntry = {
  id: 'gpt-6-luna',
  reasoningEffort: 'low',
}

export const ASSISTANT_CHAT_MODEL: OpenAIModelEntry = {
  id: 'gpt-6-luna',
  reasoningEffort: 'medium',
}

export type Model = BedrockModel | OpenAIModelId

export type ProviderModelConfig = {
  /** Optional providerOptions to attach to the system message for this model */
  systemProviderOptions?: Record<string, any>
  /** The default model for this provider (used when limited or no preferred specified) */
  default: boolean
}

export type ProviderRegistry = {
  bedrock: {
    models: Record<BedrockModel, ProviderModelConfig>
    providerOptions?: Record<string, any>
  }
  openai: {
    models: Record<OpenAIModelId, ProviderModelConfig>
    providerOptions?: Record<string, any>
  }
}

export const PROVIDERS: ProviderRegistry = {
  bedrock: {
    models: {
      'anthropic.claude-3-7-sonnet-20250219-v1:0': {
        systemProviderOptions: {
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
      'gpt-6-luna': { default: true },
    },
    providerOptions: {
      openai: {
        store: false,
      },
    },
  },
}

export function getDefaultModelForProvider(provider: ProviderName): Model | undefined {
  const models = PROVIDERS[provider]?.models as Record<Model, ProviderModelConfig>
  if (!models) return undefined

  return Object.keys(models).find((id) => models[id as Model]?.default) as Model | undefined
}

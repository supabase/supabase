export type ProviderName = 'bedrock' | 'openai' | 'anthropic'

export type BedrockModel = 'anthropic.claude-3-7-sonnet-20250219-v1:0' | 'openai.gpt-oss-120b-1:0'

export type OpenAIModelId = 'gpt-5' | 'gpt-5-mini'

export type AnthropicModel = 'claude-sonnet-4-20250514' | 'claude-3-5-haiku-20241022'

// Reasoning effort levels supported by OpenAI models.
// Source: https://developers.openai.com/api/docs/guides/reasoning + per-model pages
// Community matrix: https://community.openai.com/t/request-for-compatibility-matrix-reasoning-effort-sampling-parameters-across-gpt-5-series/1371738/2
// When adding a new model, check its individual docs page and update ModelReasoningSupport below.
export type ReasoningEffort = 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh'

// Maps each known OpenAI model to the effort levels it supports.
// Used to enforce valid combinations at compile time via openaiModelEntry().
// Note: newer models (e.g. gpt-5.4-nano, gpt-5.3-codex) support different sets of levels
// (e.g. 'none'/'xhigh' may be available; 'minimal' may not). Add entries here when
// introducing new models — check the per-model docs page and the community compatibility
// matrix: https://community.openai.com/t/request-for-compatibility-matrix-reasoning-effort-sampling-parameters-across-gpt-5-series/1371738/2
type ModelReasoningSupport = {
  'gpt-5': 'minimal' | 'low' | 'medium' | 'high'
  'gpt-5-mini': 'minimal' | 'low' | 'medium' | 'high'
}

/**
 * Type-safe factory for an OpenAI model entry.
 * `reasoningEffort` is validated against the model at compile time — invalid combinations
 * (e.g. 'none' on gpt-5-mini) are type errors.
 *
 * Use entries from ASSISTANT_MODELS for the chat assistant, or create an inline entry:
 * ```ts
 * openaiModelEntry({ id: 'gpt-5-mini', reasoningEffort: 'low' })  // valid
 * openaiModelEntry({ id: 'gpt-5-mini', reasoningEffort: 'none' }) // type error
 * openaiModelEntry({ id: 'gpt-5-mini' })                          // no reasoning (DEFAULT_COMPLETION_MODEL)
 * ```
 */
export function openaiModelEntry<ModelId extends OpenAIModelId>(config: {
  id: ModelId
  reasoningEffort?: ModelId extends keyof ModelReasoningSupport
    ? ModelReasoningSupport[ModelId]
    : never
}) {
  return config
}

export type OpenAIModelIdEntry = ReturnType<typeof openaiModelEntry>

/** Default model entry for simple completion endpoints — gpt-5-mini with no reasoning effort. */
export const DEFAULT_COMPLETION_MODEL = openaiModelEntry({ id: 'gpt-5-mini' })

// Models available to all users (free tier).
export const ASSISTANT_MODELS_BASE = [
  openaiModelEntry({ id: 'gpt-5-mini', reasoningEffort: 'minimal' }),
] as const

// Models restricted to users with `assistant.advance_model` entitlement (paid plans).
export const ASSISTANT_MODELS_ADVANCE_ONLY = [
  openaiModelEntry({ id: 'gpt-5', reasoningEffort: 'minimal' }),
] as const

// Single source of truth for all Assistant chat model variants and their reasoning levels.
// To add a free-tier model: add to ASSISTANT_MODELS_BASE.
// To add a paid-only model: add to ASSISTANT_MODELS_ADVANCE_ONLY.
export const ASSISTANT_MODELS = [
  ...ASSISTANT_MODELS_BASE,
  ...ASSISTANT_MODELS_ADVANCE_ONLY,
] as const

export type AssistantBaseModelId = (typeof ASSISTANT_MODELS_BASE)[number]['id']
export type AssistantModelId = (typeof ASSISTANT_MODELS)[number]['id']

export const DEFAULT_ASSISTANT_BASE_MODEL_ID = 'gpt-5-mini' satisfies AssistantBaseModelId

export const DEFAULT_ASSISTANT_ADVANCE_MODEL_ID = 'gpt-5' satisfies AssistantModelId

export function defaultAssistantModelId(hasAccessToAdvanceModel: boolean): AssistantModelId {
  return hasAccessToAdvanceModel
    ? DEFAULT_ASSISTANT_ADVANCE_MODEL_ID
    : DEFAULT_ASSISTANT_BASE_MODEL_ID
}

const ASSISTANT_BASE_MODEL_IDS = new Set<string>(ASSISTANT_MODELS_BASE.map((m) => m.id))

const ASSISTANT_ADVANCE_ONLY_MODEL_IDS = new Set<string>(
  ASSISTANT_MODELS_ADVANCE_ONLY.map((m) => m.id)
)

export function isAssistantBaseModelId(id: string): id is AssistantBaseModelId {
  return ASSISTANT_BASE_MODEL_IDS.has(id)
}

export function isAdvanceOnlyModelId(id: string): boolean {
  return ASSISTANT_ADVANCE_ONLY_MODEL_IDS.has(id)
}

export function getAssistantModelEntry(
  id: AssistantModelId
): (typeof ASSISTANT_MODELS)[number] | undefined {
  return ASSISTANT_MODELS.find((m) => m.id === id)
}

export type Model = BedrockModel | OpenAIModelId | AnthropicModel

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
    models: Record<OpenAIModelId, ProviderModelConfig>
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
        store: false,
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

export type ProviderName = 'bedrock' | 'openai'

export type BedrockModel = 'anthropic.claude-3-7-sonnet-20250219-v1:0' | 'openai.gpt-oss-120b-1:0'

export type OpenAIModelId = 'gpt-5.4-nano' | 'gpt-5.3-codex'

// Source: https://developers.openai.com/api/docs/guides/reasoning + per-model pages
export type ReasoningEffort = 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh'

// Per-model reasoning effort compatibility.
// Sources: https://developers.openai.com/api/docs/models/gpt-5.4-nano
//          https://developers.openai.com/api/docs/models/gpt-5.3-codex
type ModelReasoningSupport = {
  'gpt-5.4-nano': 'none' | 'low' | 'medium' | 'high' | 'xhigh'
  'gpt-5.3-codex': 'low' | 'medium' | 'high' | 'xhigh'
}

type ReasoningEffortFor<ModelId extends OpenAIModelId> = ModelId extends keyof ModelReasoningSupport
  ? ModelReasoningSupport[ModelId]
  : never

/** Type-safe factory for configuring OpenAI models with compatible reasoning efforts. */
export function openaiModelEntry<
  ModelId extends OpenAIModelId,
  RequiresAdvance extends boolean = false,
>(config: {
  id: ModelId
  /** When true, the model requires the `assistant.advance_model` entitlement (paid plans). Defaults to false. */
  requiresAdvanceModelEntitlement?: RequiresAdvance
  /**
   * When omitted, OpenAI applies its own default reasoning effort for the model,
   * which may not be zero. Use an explicit level to control cost and latency.
   */
  reasoningEffort?: ReasoningEffortFor<ModelId>
}): {
  id: ModelId
  requiresAdvanceModelEntitlement: RequiresAdvance
  reasoningEffort?: ReasoningEffortFor<ModelId>
} {
  return {
    requiresAdvanceModelEntitlement: false as RequiresAdvance,
    ...config,
  }
}

export type OpenAIModelEntry = ReturnType<typeof openaiModelEntry>

/** Default model entry for simple completion endpoints where latency is more important than reasoning. */
export const DEFAULT_COMPLETION_MODEL = openaiModelEntry({
  id: 'gpt-5.4-nano',
  reasoningEffort: 'none',
})

// Single source of truth for all Assistant chat model variants and their reasoning levels.
// Models with requiresAdvanceModelEntitlement false are available to all users; true requires the assistant.advance_model entitlement.
export const ASSISTANT_MODELS = [
  openaiModelEntry({
    id: 'gpt-5.4-nano',
    requiresAdvanceModelEntitlement: false,
    reasoningEffort: 'low',
  }),
  openaiModelEntry({
    id: 'gpt-5.3-codex',
    requiresAdvanceModelEntitlement: true,
    reasoningEffort: 'low',
  }),
] as const

export type AssistantBaseModelId = Extract<
  (typeof ASSISTANT_MODELS)[number],
  { requiresAdvanceModelEntitlement: false }
>['id']
export type AssistantModelId = (typeof ASSISTANT_MODELS)[number]['id']

const ASSISTANT_MODELS_MAP = Object.fromEntries(ASSISTANT_MODELS.map((m) => [m.id, m])) as Record<
  AssistantModelId,
  (typeof ASSISTANT_MODELS)[number]
>

export const DEFAULT_ASSISTANT_BASE_MODEL_ID = 'gpt-5.4-nano' satisfies AssistantBaseModelId

export const DEFAULT_ASSISTANT_ADVANCE_MODEL_ID = 'gpt-5.3-codex' satisfies AssistantModelId

export function defaultAssistantModelId(hasAccessToAdvanceModel: boolean): AssistantModelId {
  return hasAccessToAdvanceModel
    ? DEFAULT_ASSISTANT_ADVANCE_MODEL_ID
    : DEFAULT_ASSISTANT_BASE_MODEL_ID
}

export function isKnownAssistantModelId(id: string): id is AssistantModelId {
  return Object.hasOwn(ASSISTANT_MODELS_MAP, id)
}

export function isAssistantBaseModelId(id: string): id is AssistantBaseModelId {
  return (
    id in ASSISTANT_MODELS_MAP &&
    !ASSISTANT_MODELS_MAP[id as AssistantModelId].requiresAdvanceModelEntitlement
  )
}

export function isAdvanceOnlyModelId(id: string): boolean {
  return (
    id in ASSISTANT_MODELS_MAP &&
    ASSISTANT_MODELS_MAP[id as AssistantModelId].requiresAdvanceModelEntitlement
  )
}

export function getAssistantModelEntry(id: AssistantModelId): (typeof ASSISTANT_MODELS)[number] {
  return ASSISTANT_MODELS_MAP[id]
}

export type Model = BedrockModel | OpenAIModelId

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
      'gpt-5.3-codex': { default: false },
      'gpt-5.4-nano': { default: true },
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

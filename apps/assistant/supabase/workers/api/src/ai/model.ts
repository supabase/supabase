import { openai } from '@ai-sdk/openai'
import { LanguageModel } from 'ai'

import {
  getDefaultModelForProvider,
  Model,
  OpenAIModelEntry,
  OpenAIModelId,
  ProviderModelConfig,
  PROVIDERS,
} from './model.utils'

type ProviderOptions = Record<string, any>
type SystemProviderOptions = Record<string, any>

type ModelSuccess = {
  /** Spread directly into AI SDK calls: `streamText({ ...modelParams, ... })` */
  modelParams: { model: LanguageModel; providerOptions?: ProviderOptions }
  systemProviderOptions?: SystemProviderOptions
  error?: never
}

export type ModelError = {
  modelParams?: never
  systemProviderOptions?: never
  error: Error
}

type ModelResponse = ModelSuccess | ModelError

export type GetModelParams =
  | {
      provider: 'openai'
      /**
       * Specifies which OpenAI model to use and its reasoning effort.
       * Create entries via `openaiModelEntry()` — reasoning effort is validated against the model
       * at compile time. Use `DEFAULT_COMPLETION_MODEL` for simple endpoints (minimal reasoning).
       * Callers are responsible for resolving the correct entry (including throttling/entitlement
       * fallbacks) before calling getModel.
       */
      modelEntry: OpenAIModelEntry
    }
  | {
      provider: 'bedrock'
      /** Used for consistent hashing across Bedrock regions. */
      routingKey: string
    }

/**
 * Retrieves a LanguageModel from a specific provider and model entry.
 * Callers are responsible for resolving the correct model entry (including throttling/entitlement
 * fallbacks) before calling this function.
 * Returns systemProviderOptions that callers can attach to the system message.
 */
export async function getModel(params: GetModelParams): Promise<ModelResponse> {
  const { provider } = params

  if (provider === 'bedrock') {
    return { error: new Error('Bedrock is not supported') }
  }

  const providerRegistry = PROVIDERS[provider]
  if (!providerRegistry) {
    return { error: new Error(`Unknown provider: ${provider}`) }
  }

  const models = providerRegistry.models as Record<Model, ProviderModelConfig>
  const modelEntry = params.modelEntry

  const useDefault = !modelEntry?.id || !models[modelEntry.id]

  const chosenModelId = useDefault ? getDefaultModelForProvider(provider) : modelEntry?.id

  if (provider === 'openai') {
    if (!process.env.OPENAI_API_KEY) {
      return { error: new Error('OPENAI_API_KEY not available') }
    }
    const baseProviderOptions = providerRegistry.providerOptions?.openai ?? {}
    const openaiProviderOptions = modelEntry?.reasoningEffort
      ? { ...baseProviderOptions, reasoningEffort: modelEntry.reasoningEffort }
      : baseProviderOptions
    return {
      modelParams: {
        model: openai(chosenModelId as OpenAIModelId),
        providerOptions: { openai: openaiProviderOptions },
      },
      systemProviderOptions: models[chosenModelId as OpenAIModelId]?.systemProviderOptions,
    }
  }

  return { error: new Error(`Unsupported provider: ${provider}`) }
}

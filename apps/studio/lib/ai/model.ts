import { openai } from '@ai-sdk/openai'
import { LanguageModel } from 'ai'

import { checkAwsCredentials, createRoutedBedrock } from './bedrock'
import {
  BedrockModel,
  getDefaultModelForProvider,
  Model,
  OpenAIModelEntry,
  OpenAIModelId,
  ProviderModelConfig,
  PROVIDERS,
} from './model.utils'

type PromptProviderOptions = Record<string, any>
type ProviderOptions = Record<string, any>

type ModelSuccess = {
  /** Spread directly into AI SDK calls: `streamText({ ...modelParams, ... })` */
  modelParams: { model: LanguageModel; providerOptions?: ProviderOptions }
  promptProviderOptions?: PromptProviderOptions
  error?: never
}

export type ModelError = {
  modelParams?: never
  promptProviderOptions?: never
  error: Error
}

type ModelResponse = ModelSuccess | ModelError

export const ModelErrorMessage = 'No valid AI model available based on available credentials.'

export type GetModelParams =
  | {
      provider: 'openai'
      hasAccessToAdvanceModel?: boolean
      /**
       * Specifies which OpenAI model to use and its reasoning effort.
       * Create entries via `openaiModelEntry()` — reasoning effort is validated against the model
       * at compile time. Use `DEFAULT_COMPLETION_MODEL` for simple endpoints (minimal reasoning).
       */
      modelEntry: OpenAIModelEntry
    }
  | {
      provider: 'bedrock'
      /** Used for consistent hashing across Bedrock regions. */
      routingKey: string
      hasAccessToAdvanceModel?: boolean
    }
  | {
      provider: 'anthropic'
      hasAccessToAdvanceModel?: boolean
    }

/**
 * Retrieves a LanguageModel from a specific provider and model.
 * - If hasAccessToAdvanceModel is false, uses the provider's default model.
 * - Returns promptProviderOptions that callers can attach to the system message.
 */
export async function getModel(params: GetModelParams): Promise<ModelResponse> {
  const { provider, hasAccessToAdvanceModel = false } = params
  const envThrottled = process.env.IS_THROTTLED !== 'false'

  const providerRegistry = PROVIDERS[provider]
  if (!providerRegistry) {
    return { error: new Error(`Unknown provider: ${provider}`) }
  }

  const models = providerRegistry.models as Record<Model, ProviderModelConfig>
  const modelEntry = params.provider === 'openai' ? params.modelEntry : undefined

  const useDefault =
    !hasAccessToAdvanceModel || envThrottled || !modelEntry?.id || !models[modelEntry.id]

  const chosenModelId = useDefault ? getDefaultModelForProvider(provider) : modelEntry?.id

  if (provider === 'bedrock') {
    const hasAwsCredentials = await checkAwsCredentials()
    const hasAwsBedrockRoleArn = !!process.env.AWS_BEDROCK_ROLE_ARN
    if (!hasAwsBedrockRoleArn || !hasAwsCredentials) {
      return { error: new Error('AWS Bedrock credentials not available') }
    }
    const bedrock = createRoutedBedrock(params.routingKey)
    const model = await bedrock(chosenModelId as BedrockModel)
    const promptProviderOptions = (
      providerRegistry.models as Record<BedrockModel, ProviderModelConfig>
    )[chosenModelId as BedrockModel]?.promptProviderOptions
    return { modelParams: { model }, promptProviderOptions }
  }

  if (provider === 'openai') {
    if (!process.env.OPENAI_API_KEY) {
      return { error: new Error('OPENAI_API_KEY not available') }
    }
    const baseProviderOptions = providerRegistry.providerOptions?.openai ?? {}
    const openaiProviderOptions = !useDefault && modelEntry?.reasoningEffort
      ? { ...baseProviderOptions, reasoningEffort: modelEntry.reasoningEffort }
      : baseProviderOptions
    return {
      modelParams: {
        model: openai(chosenModelId as OpenAIModelId),
        providerOptions: { openai: openaiProviderOptions },
      },
      promptProviderOptions: models[chosenModelId as OpenAIModelId]?.promptProviderOptions,
    }
  }

  return { error: new Error(`Unsupported provider: ${provider}`) }
}

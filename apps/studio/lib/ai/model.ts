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
      /** Use `DEFAULT_COMPLETION_MODEL` for latency-sensitive completions. */
      modelEntry: OpenAIModelEntry
    }
  | {
      provider: 'bedrock'
      /** Used for consistent hashing across Bedrock regions. */
      routingKey: string
    }

/**
 * Retrieves a LanguageModel from a specific provider and model entry.
 * Returns systemProviderOptions that callers can attach to the system message.
 */
export async function getModel(params: GetModelParams): Promise<ModelResponse> {
  const { provider } = params

  const providerRegistry = PROVIDERS[provider]
  if (!providerRegistry) {
    return { error: new Error(`Unknown provider: ${provider}`) }
  }

  const models = providerRegistry.models as Record<Model, ProviderModelConfig>
  const modelEntry = params.provider === 'openai' ? params.modelEntry : undefined

  const useDefault = !modelEntry?.id || !models[modelEntry.id]

  const chosenModelId = useDefault ? getDefaultModelForProvider(provider) : modelEntry?.id

  if (provider === 'bedrock') {
    const hasAwsCredentials = await checkAwsCredentials()
    const hasAwsBedrockRoleArn = !!process.env.AWS_BEDROCK_ROLE_ARN
    if (!hasAwsBedrockRoleArn || !hasAwsCredentials) {
      return { error: new Error('AWS Bedrock credentials not available') }
    }
    const bedrock = createRoutedBedrock(params.routingKey)
    const model = await bedrock(chosenModelId as BedrockModel)
    const systemProviderOptions = (
      providerRegistry.models as Record<BedrockModel, ProviderModelConfig>
    )[chosenModelId as BedrockModel]?.systemProviderOptions
    return { modelParams: { model }, systemProviderOptions }
  }

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

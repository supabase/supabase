import { openai } from '@ai-sdk/openai'
import { LanguageModel } from 'ai'
import { checkAwsCredentials, createRoutedBedrock } from './bedrock'
import {
  BedrockModel,
  Model,
  OpenAIModel,
  PROVIDERS,
  ProviderModelConfig,
  ProviderName,
  ReasoningEffort,
  getDefaultModelForProvider,
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

export type GetModelParams = {
  provider?: ProviderName
  model?: Model
  routingKey: string
  hasAccessToAdvanceModel?: boolean
  /** Reasoning effort for OpenAI models. If omitted, OpenAI uses its model default. */
  reasoningEffort?: ReasoningEffort
}

/**
 * Retrieves a LanguageModel from a specific provider and model.
 * - If provider/model not specified, auto-selects based on available credentials (prefers Bedrock).
 * - If hasAccessToAdvanceModel is false, uses the provider's default model.
 * - Returns promptProviderOptions that callers can attach to the system message.
 */
export async function getModel({
  provider,
  model,
  routingKey,
  hasAccessToAdvanceModel = false,
  reasoningEffort,
}: GetModelParams): Promise<ModelResponse> {
  const envThrottled = process.env.IS_THROTTLED !== 'false'

  let preferredProvider: ProviderName | undefined = provider

  const hasAwsCredentials = await checkAwsCredentials()
  const hasAwsBedrockRoleArn = !!process.env.AWS_BEDROCK_ROLE_ARN
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY

  // Auto-pick a provider if not specified defaulting to Bedrock
  if (!preferredProvider) {
    if (hasAwsBedrockRoleArn && hasAwsCredentials) {
      preferredProvider = 'bedrock'
    } else if (hasOpenAIKey) {
      preferredProvider = 'openai'
    }
  }

  if (!preferredProvider) {
    return { error: new Error(ModelErrorMessage) }
  }

  const providerRegistry = PROVIDERS[preferredProvider]
  if (!providerRegistry) {
    return { error: new Error(`Unknown provider: ${preferredProvider}`) }
  }

  const models = providerRegistry.models as Record<Model, ProviderModelConfig>

  const useDefault = !hasAccessToAdvanceModel || envThrottled || !model || !models[model]

  const chosenModelId = useDefault ? getDefaultModelForProvider(preferredProvider) : model

  if (preferredProvider === 'bedrock') {
    if (!hasAwsBedrockRoleArn || !hasAwsCredentials) {
      return { error: new Error('AWS Bedrock credentials not available') }
    }
    const bedrock = createRoutedBedrock(routingKey)
    const model = await bedrock(chosenModelId as BedrockModel)
    const promptProviderOptions = (
      providerRegistry.models as Record<BedrockModel, ProviderModelConfig>
    )[chosenModelId as BedrockModel]?.promptProviderOptions
    return { modelParams: { model }, promptProviderOptions }
  }

  if (preferredProvider === 'openai') {
    if (!hasOpenAIKey) {
      return { error: new Error('OPENAI_API_KEY not available') }
    }
    const baseProviderOptions = providerRegistry.providerOptions?.openai ?? {}
    const openaiProviderOptions = reasoningEffort
      ? { ...baseProviderOptions, reasoningEffort }
      : baseProviderOptions
    return {
      modelParams: {
        model: openai(chosenModelId as OpenAIModel),
        providerOptions: { openai: openaiProviderOptions },
      },
      promptProviderOptions: models[chosenModelId as OpenAIModel]?.promptProviderOptions,
    }
  }

  return { error: new Error(`Unsupported provider: ${preferredProvider}`) }
}

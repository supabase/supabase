import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { LanguageModel } from 'ai'
import { checkAwsCredentials, createRoutedBedrock } from './bedrock'
import {
  PROVIDERS,
  ProviderName,
  getDefaultModelForProvider,
  BedrockModel,
  OpenAIModel,
  AnthropicModel,
  Model,
  ProviderModelConfig,
} from './model.utils'

export type PromptProviderOptions = Record<string, any>

export type ModelSuccess = {
  model: LanguageModel
  promptProviderOptions?: PromptProviderOptions
  error?: never
}

export type ModelError = {
  model?: never
  promptProviderOptions?: never
  error: Error
}

export type ModelResponse = ModelSuccess | ModelError

export const ModelErrorMessage = 'No valid AI model available based on available credentials.'

export type GetModelParams = {
  provider?: ProviderName
  model?: Model
  routingKey: string
  isLimited?: boolean
}

/**
 * Retrieves a LanguageModel from a specific provider and model.
 * - If provider/model not specified, auto-selects based on available credentials (prefers Bedrock).
 * - If isLimited is true, uses the provider's default model.
 * - Returns promptProviderOptions that callers can attach to the system message.
 */
export async function getModel(params: GetModelParams): Promise<ModelResponse> {
  const { provider, model, routingKey, isLimited = true } = params
  const envThrottled = process.env.IS_THROTTLED !== 'false'

  let preferredProvider: ProviderName | undefined = provider

  const hasAwsCredentials = await checkAwsCredentials()
  const hasAwsBedrockRoleArn = !!process.env.AWS_BEDROCK_ROLE_ARN
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY

  // Auto-pick a provider if not specified defaulting to Bedrock
  if (!preferredProvider) {
    if (hasAwsBedrockRoleArn && hasAwsCredentials) {
      preferredProvider = 'bedrock'
    } else if (hasOpenAIKey) {
      preferredProvider = 'openai'
    } else if (hasAnthropicKey) {
      preferredProvider = 'anthropic'
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

  const useDefault = isLimited || envThrottled || !model || !models[model]

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
    return { model, promptProviderOptions }
  }

  if (preferredProvider === 'openai') {
    if (!hasOpenAIKey) {
      return { error: new Error('OPENAI_API_KEY not available') }
    }
    return {
      model: openai(chosenModelId as OpenAIModel),
      promptProviderOptions: models[chosenModelId as OpenAIModel]?.promptProviderOptions,
    }
  }

  if (preferredProvider === 'anthropic') {
    if (!hasAnthropicKey) {
      return { error: new Error('ANTHROPIC_API_KEY not available') }
    }
    return {
      model: anthropic(chosenModelId as AnthropicModel),
      promptProviderOptions: models[chosenModelId as AnthropicModel]?.promptProviderOptions,
    }
  }

  return { error: new Error(`Unsupported provider: ${preferredProvider}`) }
}

import { openai } from '@ai-sdk/openai'
import { LanguageModel } from 'ai'
import {
  bedrockForRegion,
  BedrockRegion,
  checkAwsCredentials,
  selectBedrockRegion,
  BedrockModel,
  regionPrefixMap,
} from './bedrock'

// Default behaviour here is to be throttled (e.g if this env var is not available, IS_THROTTLED should be true, unless specified 'false')
const IS_THROTTLED = process.env.IS_THROTTLED !== 'false'
const PRO_MODEL: BedrockModel = 'anthropic.claude-3-7-sonnet-20250219-v1:0'
const NORMAL_MODEL = 'anthropic.claude-3-5-haiku-20241022-v1:0'
const OPENAI_MODEL = 'gpt-4.1-2025-04-14'

export type ModelSuccess = {
  model: LanguageModel
  error?: never
}

export type ModelError = {
  model?: never
  error: Error
}

export type ModelResponse = ModelSuccess | ModelError

export const ModelErrorMessage =
  'No valid AI model available. Please set up a local AWS profile to use Bedrock, or pass an OPENAI_API_KEY to use OpenAI.'

/**
 * Retrieves the appropriate AI model based on available credentials.
 *
 * An optional routing key can be provided to distribute requests across
 * different Bedrock regions.
 */
export async function getModel(routingKey?: string, isLimited?: boolean): Promise<ModelResponse> {
  const hasAwsCredentials = await checkAwsCredentials()
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY

  if (hasAwsCredentials) {
    const model = IS_THROTTLED || isLimited ? NORMAL_MODEL : PRO_MODEL
    // Select the Bedrock region based on the routing key and the model
    const bedrockRegion: BedrockRegion = routingKey
      ? await selectBedrockRegion(routingKey, model)
      : // There's a few places where getModel is called without a routing key
        // Will cause disproportionate load on use1 region
        'use1'
    const bedrock = bedrockForRegion(bedrockRegion)
    const modelName = `${regionPrefixMap[bedrockRegion]}.${model}`

    return {
      model: bedrock(modelName),
    }
  }

  if (hasOpenAIKey) {
    return {
      model: openai(OPENAI_MODEL),
    }
  }

  return {
    error: new Error(ModelErrorMessage),
  }
}
